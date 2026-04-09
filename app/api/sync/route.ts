import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── THE GATEKEEPER SHIELD ──────────────────────────────────────────────
// The Block-List: Folders, lock files, and binaries we DO NOT want.
const IGNORED_PATTERNS = [
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.DS_Store', 'Thumbs.db',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.mp4', '.mov', '.mp3', '.pdf', '.zip', '.tar.gz'
];

// Checks the full path to prevent "Path Blindness"
function shouldIgnore(filePath: string): boolean {
  if (!filePath) return false;
  return IGNORED_PATTERNS.some(pattern => 
    filePath.toLowerCase().includes(pattern.toLowerCase())
  );
}
// ────────────────────────────────────────────────────────────────────────

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
    // Note: If you want to sync deep folders in the future, this endpoint 
    // will need to be upgraded to the Git Trees API, but this handles the current structure.
    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })

    if (!githubRes.ok) throw new Error("Could not reach GitHub. Check if the repo is public.")
    const files = await githubRes.json()

    // 3. Process Files (The New Filter)
    const validFiles = files.filter((f: any) => {
      // Rule 1: Must be a file, not a directory wrapper
      if (f.type !== 'file') return false;
      
      // Rule 2: THE GATEKEEPER - Drops node_modules and lock-files instantly
      if (shouldIgnore(f.path || f.name)) {
        console.log(`[Gatekeeper] Blocked: ${f.path || f.name}`);
        return false;
      }
      
      // Rule 3: The Allow-list - Only grab valid source code
      if (!f.name.match(/\.(ts|tsx|js|jsx|json|md|py|html|css)$/)) return false;
      
      return true;
    });

    if (validFiles.length === 0) throw new Error("No compatible source code files found after filtering.")

    // 4. Download Content for Valid Files
    const memories = await Promise.all(
      validFiles.map(async (file: any) => {
        const rawRes = await fetch(file.download_url)
        const rawContent = await rawRes.text()
        return {
          project_id: projectId,
          file_name: file.name, 
          name: file.name,      
          content: redactSecrets(rawContent).substring(0, 10000), 
        }
      })
    )

    // 5. Update Database securely
    await supabase.from('code_memories').delete().eq('project_id', projectId)
    const { error: memError } = await supabase.from('code_memories').insert(memories)
    if (memError) throw memError

    // 6. Update Sync Timestamp
    await supabase.from('projects').update({ last_sync: new Date().toISOString() }).eq('id', projectId)

    return NextResponse.json({ success: true, count: memories.length })

  } catch (err: any) {
    console.error('[Sync Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
