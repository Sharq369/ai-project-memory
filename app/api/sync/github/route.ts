import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { repo, projectId } = await req.json()
    
    if (!repo || !projectId) {
      return NextResponse.json({ success: false, error: "Missing repository name or Project ID." }, { status: 400 })
    }

    // 1. Authenticate the User (Required for your RLS policies)
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name) { return cookieStore.get(name)?.value } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Neural Link severed: User not authenticated." }, { status: 401 })
    }

    // 2. Fetch the Repository Structure from GitHub
    // This finds out if their default branch is 'main' or 'master'
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`)
    if (!repoRes.ok) {
      return NextResponse.json({ success: false, error: "Repository not found. Make sure it is public and formatted as 'owner/repo'." }, { status: 404 })
    }
    const repoData = await repoRes.json()
    const branch = repoData.default_branch

    // Get the entire file tree
    const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`)
    const treeData = await treeRes.json()

    if (!treeData.tree) {
      return NextResponse.json({ success: false, error: "Failed to read repository structure." }, { status: 500 })
    }

    // 3. Filter the Files (We don't want node_modules or images)
    const filesToFetch = treeData.tree
      .filter((file: any) => 
        file.type === 'blob' && 
        !file.path.includes('node_modules/') &&
        !file.path.includes('.git/') &&
        !file.path.endsWith('.lock') &&
        !file.path.endsWith('.png') &&
        !file.path.endsWith('.jpg') &&
        !file.path.endsWith('.ico')
      )
      .slice(0, 15) // Limit to the first 15 files to prevent Vercel server timeouts

    // 4. Download File Contents
    const memories = await Promise.all(
      filesToFetch.map(async (file: any) => {
        const contentRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file.path}`)
        const content = await contentRes.text()
        
        return {
          project_id: projectId,
          user_id: user.id, // Explicitly passing user_id to satisfy your "Users can create own memories" RLS policy
          file_name: file.path,
          content: content
        }
      })
    )

    // 5. Inject into Supabase Vault
    const { error } = await supabase.from('code_memories').insert(memories)
    
    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, count: memories.length })

  } catch (error: any) {
    console.error("Sync Error:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
