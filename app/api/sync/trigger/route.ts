import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.md']
const MAX_FILES = 15

interface GitHubContent {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url: string | null
  size: number
}

// Parse GitHub URL to extract owner/repo
function parseGitHubUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
}

// Recursively fetch files from GitHub
async function fetchFilesRecursive(
  repoPath: string,
  path: string = '',
  token: string,
  collected: GitHubContent[] = []
): Promise<GitHubContent[]> {
  if (collected.length >= MAX_FILES) return collected

  const url = `https://api.github.com/repos/${repoPath}/contents/${path}`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Neural-Memory-App'
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub API failed: ${response.status}`)
  }

  const contents: GitHubContent[] = await response.json()

  for (const item of contents) {
    if (collected.length >= MAX_FILES) break

    if (item.type === 'file') {
      const hasAllowedExt = ALLOWED_EXTENSIONS.some(ext => 
        item.name.toLowerCase().endsWith(ext)
      )
      
      if (hasAllowedExt && item.size < 500000) {
        collected.push(item)
      }
    } else if (item.type === 'dir') {
      const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage']
      if (!skipDirs.includes(item.name)) {
        await fetchFilesRecursive(repoPath, item.path, token, collected)
      }
    }
  }

  return collected
}

// Fetch file content
async function fetchFileContent(downloadUrl: string, token: string): Promise<string> {
  const response = await fetch(downloadUrl, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.raw'
    }
  })
  
  if (!response.ok) throw new Error('Failed to fetch file content')
  return await response.text()
}

export async function POST(req: Request) {
  try {
    const { url, projectId, provider } = await req.json()

    if (!url || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing url or projectId' },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    // 1. Parse GitHub URL
    const repoPath = parseGitHubUrl(url)
    console.log(`Syncing repository: ${repoPath}`)

    // 2. Fetch files recursively
    const files = await fetchFilesRecursive(repoPath, '', githubToken)

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No relevant files found in repository'
      }, { status: 404 })
    }

    console.log(`Found ${files.length} files to sync`)

    // 3. Wipe old memories for this project
    await supabase.from('code_memories').delete().eq('project_id', projectId)

    // 4. Process and insert new memories with explicit status and file_path
    const memories = []
    
    for (const file of files) {
      if (!file.download_url) continue
      
      try {
        const content = await fetchFileContent(file.download_url, githubToken)
        
        // ✅ EXPLICIT MAPPING: status and file_path for UI display
        memories.push({
          project_id: projectId,
          content: content,
          file_path: file.path,  // Maps to file_path column for UI filename display
          status: 'completed'     // Explicitly set for green tick
        })
        
        console.log(`✓ Processed: ${file.path}`)
      } catch (error) {
        console.error(`Failed to fetch ${file.path}:`, error)
      }
    }

    // 5. Insert all memories at once
    const { error: insertError } = await supabase
      .from('code_memories')
      .insert(memories)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    console.log(`✅ Successfully synced ${memories.length} files`)

    return NextResponse.json({
      success: true,
      count: memories.length,
      repository: repoPath,
      files: memories.map(m => m.file_path) // Return list of synced files
    })

  } catch (error: any) {
    console.error('Sync Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
