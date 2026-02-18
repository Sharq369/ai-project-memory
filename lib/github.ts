import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
type Provider = 'github' | 'gitlab' | 'bitbucket'

interface ParsedRepo {
  owner: string  
  repo: string   
  host: string   
}

interface NormalizedFile {
  path: string
  content: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.css']
const EXCLUDED_PATHS   = ['node_modules', '.next', '__pycache__', 'dist', '.git']
const FILE_LIMIT       = 15

// ─── URL Parser ───────────────────────────────────────────────────────────────
function parseRepoUrl(repoUrl: string): ParsedRepo {
  const url = new URL(repoUrl.replace(/\/$/, ''))
  const parts = url.pathname.replace(/^\//, '').split('/')

  if (parts.length < 2) {
    throw new Error(`Invalid repository URL format.`)
  }

  const host  = url.hostname
  const repo  = parts[parts.length - 1]
  const owner = parts.slice(0, parts.length - 1).join('/')

  return { host, owner, repo }
}

// ─── Auth Headers ─────────────────────────────────────────────────────────────
function getAuthHeaders(provider: Provider): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (provider === 'github' && process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  } else if (provider === 'gitlab' && process.env.GITLAB_TOKEN) {
    headers['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN
  } else if (provider === 'bitbucket' && process.env.BITBUCKET_TOKEN) {
    headers['Authorization'] = `Basic ${process.env.BITBUCKET_TOKEN}`
  }

  return headers
}

// ─── Provider: GitHub ─────────────────────────────────────────────────────────
async function fetchFromGitHub({ owner, repo }: ParsedRepo, headers: Record<string, string>): Promise<NormalizedFile[]> {
  for (const branch of ['main', 'master']) {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers })
    if (!treeRes.ok) continue

    const treeData = await treeRes.json()
    if (!treeData.tree) continue

    const blobs = treeData.tree.filter((f: any) =>
      f.type === 'blob' &&
      VALID_EXTENSIONS.some(ext => f.path.endsWith(ext)) &&
      !EXCLUDED_PATHS.some(excluded => f.path.includes(excluded))
    ).slice(0, FILE_LIMIT)

    const files: NormalizedFile[] = []
    for (const blob of blobs) {
      const contentRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${blob.path}`, { headers })
      if (contentRes.ok) files.push({ path: blob.path, content: await contentRes.text() })
    }
    return files
  }
  throw new Error('GitHub access failed. Repository might be private or URL is wrong.')
}

// ─── Provider: GitLab ─────────────────────────────────────────────────────────
async function fetchFromGitLab({ owner, repo }: ParsedRepo, headers: Record<string, string>): Promise<NormalizedFile[]> {
  const projectPath = encodeURIComponent(`${owner}/${repo}`)
  const baseUrl = 'https://gitlab.com/api/v4'
  const treeRes = await fetch(`${baseUrl}/projects/${projectPath}/repository/tree?recursive=true&per_page=100`, { headers })

  if (!treeRes.ok) throw new Error(`GitLab Error: ${treeRes.status}`)

  const treeData: any[] = await treeRes.json()
  const blobs = treeData.filter(f =>
    f.type === 'blob' &&
    VALID_EXTENSIONS.some(ext => f.path.endsWith(ext)) &&
    !EXCLUDED_PATHS.some(excluded => f.path.includes(excluded))
  ).slice(0, FILE_LIMIT)

  const files: NormalizedFile[] = []
  for (const blob of blobs) {
    const encodedPath = encodeURIComponent(blob.path)
    const contentRes = await fetch(`${baseUrl}/projects/${projectPath}/repository/files/${encodedPath}/raw`, { headers })
    if (contentRes.ok) files.push({ path: blob.path, content: await contentRes.text() })
  }
  return files
}

// ─── Provider: Bitbucket ──────────────────────────────────────────────────────
async function fetchFromBitbucket({ owner, repo }: ParsedRepo, headers: Record<string, string>): Promise<NormalizedFile[]> {
  const baseUrl = `https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/src/HEAD`
  const files: NormalizedFile[] = []

  async function crawl(path: string = "") {
    if (files.length >= FILE_LIMIT) return
    const res = await fetch(`${baseUrl}/${path}?pagelen=100`, { headers })
    if (!res.ok) return
    const data = await res.json()

    for (const item of (data.values ?? [])) {
      if (files.length >= FILE_LIMIT) break
      if (item.type === 'commit_file') {
        if (VALID_EXTENSIONS.some(ext => item.path.endsWith(ext)) && !EXCLUDED_PATHS.some(ex => item.path.includes(ex))) {
          const cRes = await fetch(`${baseUrl}/${item.path}`, { headers })
          if (cRes.ok) files.push({ path: item.path, content: await cRes.text() })
        }
      } else if (item.type === 'commit_directory') {
        if (!EXCLUDED_PATHS.some(ex => item.path.includes(ex))) await crawl(item.path)
      }
    }
  }
  await crawl("")
  return files
}

// ─── THE EXPORTED FUNCTION (This was missing!) ────────────────────────────────
export async function syncRepo(repoUrl: string, projectId: string, provider: Provider) {
  try {
    const parsed = parseRepoUrl(repoUrl)
    let files: NormalizedFile[] = []

    if (provider === 'github') files = await fetchFromGitHub(parsed, getAuthHeaders('github'))
    else if (provider === 'gitlab') files = await fetchFromGitLab(parsed, getAuthHeaders('gitlab'))
    else if (provider === 'bitbucket') files = await fetchFromBitbucket(parsed, getAuthHeaders('bitbucket'))

    if (files.length === 0) return { success: false, error: 'No valid source files found.' }

    const { data: { user } } = await supabase.auth.getUser()
    const rows = files.map(f => ({
      content: `SOURCE FILE: ${f.path}\n\n${f.content}`,
      tag: 'CODE',
      project_id: projectId,
      user_id: user?.id
    }))

    const { error } = await supabase.from('memories').insert(rows)
    if (error) throw error

    return { success: true, count: files.length }
  } catch (err: any) {
    console.error("Sync Logic Error:", err)
    return { success: false, error: err.message }
  }
}
