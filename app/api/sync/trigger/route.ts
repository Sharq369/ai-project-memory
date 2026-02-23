import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function redactSecrets(content: string): string {
  const patterns = [
    /sk-[a-zA-Z0-9]{48}/g,
    /AIza[0-9A-Za-z-_]{35}/g,
    /gh[p|o|r|s|b|e]_[a-zA-Z0-9]{36,251}/g
  ];
  let scrubbed = content;
  patterns.forEach(p => scrubbed = scrubbed.replace(p, "[REDACTED_SENSITIVE_DATA]"));
  return scrubbed;
}

export async function POST(req: Request) {
  try {
    const { repoUrl, projectId, provider } = await req.json()

    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        repo_url: repoUrl, 
        provider, 
        last_sync: new Date().toISOString() 
      })
      .eq('id', projectId)

    if (updateError) throw updateError

    // Smart URL Parsing
    const cleanUrl = repoUrl.replace(/\.git$/, '').replace(/\/$/, '')
    const path = cleanUrl.replace('https://github.com/', '')
    const [owner, repo] = path.split('/')

    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    
    if (!githubRes.ok) throw new Error("Could not reach GitHub repository. Check URL or Repo visibility.")
    const files = await githubRes.json()

    if (Array.isArray(files)) {
      await supabase.from('code_memories').delete().eq('project_id', projectId)

      const memories = await Promise.all(files
        .filter(f => f.type === 'file' && f.name.match(/\.(ts|tsx|js|jsx|json|md)$/))
        .map(async (file) => {
          const rawRes = await fetch(file.download_url)
          const rawContent = await rawRes.text()
          
          return {
            project_id: projectId,
            file_name: file.name, // <-- Fixed: Maps exactly to your database column
            content: redactSecrets(rawContent),
            type: 'code_file'
          }
        })
      )

      const { error: memError } = await supabase.from('code_memories').insert(memories)
      if (memError) throw memError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Sync Logic Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
