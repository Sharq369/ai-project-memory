import { supabase } from './supabase'

/**
 * Fetches files from a public GitHub repo and saves them as project memories.
 */
export async function syncGitHubRepo(repoUrl: string, projectId: string) {
  try {
    // 1. Clean the URL and get Owner/Repo
    const cleanPath = repoUrl.replace('https://github.com/', '').replace(/\/$/, '')
    const [owner, repo] = cleanPath.split('/')

    if (!owner || !repo) throw new Error("Invalid GitHub URL format.")

    // 2. Fetch the file tree (Main branch)
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`)
    const treeData = await treeRes.json()

    if (!treeData.tree) throw new Error("Could not access repository. Is it public?")

    // 3. Filter for meaningful source files
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.css']
    const files = treeData.tree.filter((f: any) => 
      f.type === 'blob' && 
      validExtensions.some(ext => f.path.endsWith(ext)) &&
      !f.path.includes('node_modules') &&
      !f.path.includes('.next')
    ).slice(0, 15) // Limiting to 15 files to prevent database bloat initially

    // 4. Get Current User for RLS
    const { data: { user } } = await supabase.auth.getUser()

    // 5. Download and Store
    for (const file of files) {
      const contentRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`)
      const text = await contentRes.text()

      await supabase.from('memories').insert([{
        content: `SOURCE FILE: ${file.path}\n\n${text}`,
        tag: 'CODE',
        project_id: projectId,
        user_id: user?.id
      }])
    }

    return { success: true, count: files.length }
  } catch (err: any) {
    console.error("GitHub Sync Error:", err)
    return { success: false, error: err.message }
  }
}
