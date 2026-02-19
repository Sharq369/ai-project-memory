import { NextRequest, NextResponse } from 'next/server'
// CORRECTED: 4 levels back to reach Root from app/api/sync/trigger/
import { supabase } from '../../../../lib/supabase'

interface SyncRequest {
  projectId: string
  provider: 'github' | 'bitbucket'
}

interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string
  sha: string
}

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.py', '.md']

function shouldProcessFile(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
}

async function fetchGitHubFiles(
  owner: string,
  repo: string,
  path: string = '',
  token: string
): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) return files
  const contents: GitHubContent[] = await response.json()

  for (const item of contents) {
    if (item.type === 'file' && shouldProcessFile(item.name)) {
      if (item.download_url) {
        const contentResponse = await fetch(item.download_url)
        const content = await contentResponse.text()
        files.push({ path: item.path, content })
      }
    } else if (item.type === 'dir') {
      const subFiles = await fetchGitHubFiles(owner, repo, item.path, token)
      files.push(...subFiles)
    }
  }
  return files
}

async function fetchBitbucketFiles(
  workspace: string,
  repoSlug: string,
  username: string,
  appPassword: string,
  path: string = ''
): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = []
  const url = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/src/main/${path}`
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64')
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Basic ${auth}` },
  })

  if (!response.ok) return files
  const data = await response.json()

  if (data.values) {
    for (const item of data.values) {
      if (item.type === 'commit_file' && shouldProcessFile(item.path)) {
        const fileUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repoSlug}/src/main/${item.path}`
        const fileResponse = await fetch(fileUrl, {
          headers: { 'Authorization': `Basic ${auth}` },
        })
        const content = await fileResponse.text()
        files.push({ path: item.path, content })
      } else if (item.type === 'commit_directory') {
        const subFiles = await fetchBitbucketFiles(workspace, repoSlug, username, appPassword, item.path)
        files.push(...subFiles)
      }
    }
  }
  return files
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json()
    const { projectId, provider } = body

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner, repo_name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { owner, repo_name } = project
    let files: Array<{ path: string; content: string }> = []

    if (provider === 'github') {
      const token = process.env.GITHUB_TOKEN
      if (!token) return NextResponse.json({ error: 'GITHUB_TOKEN missing' }, { status: 500 })
      files = await fetchGitHubFiles(owner, repo_name, '', token)
    } else if (provider === 'bitbucket') {
      const username = process.env.BITBUCKET_USERNAME
      const appPassword = process.env.BITBUCKET_APP_PASSWORD
      if (!username || !appPassword) return NextResponse.json({ error: 'Bitbucket credentials missing' }, { status: 500 })
      files = await fetchBitbucketFiles(owner, repo_name, username, appPassword)
    }

    let successCount = 0
    for (const file of files) {
      const { error } = await supabase
        .from('code_memories')
        .upsert(
          { project_id: projectId, file_name: file.path, content: file.content },
          { onConflict: 'project_id,file_name' }
        )
      if (!error) successCount++
    }

    return NextResponse.json({ success: true, message: `Synced ${successCount} files` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
