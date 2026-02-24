import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function redactSecrets(content: string): string {
  const patterns = [/sk-[a-zA-Z0-9]{48}/g, /AIza[0-9A-Za-z-_]{35}/g];
  let scrubbed = content;
  patterns.forEach(p => scrubbed = scrubbed.replace(p, "[REDACTED_SENSITIVE_DATA]"));
  return scrubbed;
}

export async function POST(req: Request) {
  try {
    const { repoUrl, projectId } = await req.json()

    // 1. Clean and Parse URL
    const cleanUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '')
    const path = cleanUrl.replace('https://github.com/', '')
    const [owner, repo] = path.split('/')

    if (!owner || !repo) throw new Error("Invalid GitHub URL format.")

    // 2. Fetch from GitHub API
    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })

    if (!githubRes.ok) throw new Error("Could not reach GitHub. Check if the repo is public.")
    const files = await githubRes.json()

    // 3. Process Files (Filtering for code only)
    const memories = await Promise.all(
      files
        .filter((f: any) => f.type === 'file' && f.name.match(/\.(ts|tsx|js|jsx|json|md)$/))
        .map(async (file: any) => {
          const rawRes = await fetch(file.download_url)
          const rawContent = await rawRes.text()
          return {
            project_id: projectId,
            file_name: file.name, // Matches your DB column
            name: file.name,      // Matches the 'Vault' display column
            content: redactSecrets(rawContent).substring(0, 10000), 
          }
        })
    )

    if (memories.length === 0) throw new Error("No compatible code files found in this repo.")

    // 4. Update Database
    await supabase.from('code_memories').delete().eq('project_id', projectId)
    const { error: memError } = await supabase.from('code_memories').insert(memories)
    if (memError) throw memError

    // 5. Update Sync Timestamp
    await supabase.from('projects').update({ last_sync: new Date().toISOString() }).eq('id', projectId)

    return NextResponse.json({ success: true, count: memories.length })

  } catch (error: any) {
    console.error("Sync Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
