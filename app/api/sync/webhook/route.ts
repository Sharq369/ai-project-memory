import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Re-using the security layer
function redactSecrets(content: string): string {
  const patterns = [/sk-[a-zA-Z0-9]{48}/g, /AIza[0-9A-Za-z-_]{35}/g, /gh[p|o|r|s|b|e]_[a-zA-Z0-9]{36,251}/g];
  let scrubbed = content;
  patterns.forEach(p => scrubbed = scrubbed.replace(p, "[REDACTED]"));
  return scrubbed;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const repoUrl = payload.repository.html_url;

    // 1. Find the project linked to this repository
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id')
      .eq('repo_url', repoUrl)
      .single();

    if (pError || !project) return NextResponse.json({ message: "Project not linked" }, { status: 200 });

    // 2. Fetch latest files from the main branch
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    const files = await githubRes.json();

    if (Array.isArray(files)) {
      // 3. Clear old memories to refresh data
      await supabase.from('code_memories').delete().eq('project_id', project.id);

      const memories = await Promise.all(files
        .filter(f => f.type === 'file' && f.name.match(/\.(ts|tsx|js|jsx|json|md)$/))
        .map(async (file) => {
          const rawRes = await fetch(file.download_url);
          const rawContent = await rawRes.text();
          return {
            project_id: project.id,
            name: file.name,
            content: redactSecrets(rawContent),
            type: 'code_file'
          };
        })
      );

      // 4. Update the Vault with new blocks
      await supabase.from('code_memories').insert(memories);
      await supabase.from('projects').update({ last_sync: new Date().toISOString() }).eq('id', project.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
