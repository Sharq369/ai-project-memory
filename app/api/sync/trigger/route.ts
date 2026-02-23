import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Security Layer: Removes common sensitive patterns before saving to DB
function redactSecrets(content: string): string {
  const patterns = [
    /sk-[a-zA-Z0-9]{48}/g,                  // OpenAI Keys
    /AIza[0-9A-Za-z-_]{35}/g,               // Google API Keys
    /gh[p|o|r|s|b|e]_[a-zA-Z0-9]{36,251}/g, // GitHub Tokens
    /postgres:\/\/[^:]+:[^@]+@[^/]+\/[^?\s]+/g // DB Connection Strings
  ];
  
  let scrubbed = content;
  patterns.forEach(pattern => {
    scrubbed = scrubbed.replace(pattern, "[REDACTED_SENSITIVE_DATA]");
  });
  return scrubbed;
}

export async function POST(req: Request) {
  try {
    const { repoUrl, projectId, provider } = await req.json()

    // 1. Establish Link in Project Table
    const { error: updateError } = await supabase
      .from('projects')
      .update({ repo_url: repoUrl, provider, last_sync: new Date().toISOString() })
      .eq('id', projectId)

    if (updateError) throw updateError

    // 2. Extract Repo Info
    const path = repoUrl.replace('https://github.com/', '')
    const [owner, repo] = path.split('/')

    // 3. Fetch Repository Content (Fetching the actual file data)
    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    const files = await githubRes.json()

    if (Array.isArray(files)) {
      const memories = await Promise.all(files
        .filter(f => f.type === 'file' && !f.name.endsWith('.png')) // Skip images
        .map(async (file) => {
          // Fetch raw content for each file
          const rawRes = await fetch(file.download_url)
          const rawContent = await rawRes.text()
          
          return {
            project_id: projectId,
            name: file.name,
            // Apply Redaction before saving
            content: redactSecrets(rawContent), 
            type: 'code_file',
            created_at: new Date().toISOString()
          }
        })
      )

      // 4. Batch Insert to fill the empty page
      const { error: memError } = await supabase.from('code_memories').insert(memories)
      if (memError) throw memError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
