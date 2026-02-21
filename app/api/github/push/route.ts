import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PushRequest {
  path: string
  content: string
  repoUrl: string
  projectId: string
  commitMessage?: string
}

// Parse GitHub URL to extract owner/repo
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const cleaned = url
    .trim()
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')
  
  const [owner, repo] = cleaned.split('/')
  
  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL format')
  }
  
  return { owner, repo }
}

export async function POST(req: Request) {
  try {
    const body: PushRequest = await req.json()
    const { path, content, repoUrl, projectId, commitMessage } = body

    // Validate inputs
    if (!path || !content || !repoUrl || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: path, content, repoUrl, projectId' },
        { status: 400 }
      )
    }

    const githubToken = process.env.GITHUB_TOKEN
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN not configured')
    }

    // Parse GitHub URL
    const { owner, repo } = parseGitHubUrl(repoUrl)
    console.log(`Updating file: ${path} in ${owner}/${repo}`)

    // Step 1: GET the current file to retrieve its SHA
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Neural-Memory-App'
      }
    })

    let sha: string | undefined

    if (getResponse.ok) {
      const fileData = await getResponse.json()
      sha = fileData.sha
      console.log(`File exists, SHA: ${sha}`)
    } else if (getResponse.status === 404) {
      console.log('File does not exist, will create new file')
      // No SHA needed for new files
    } else {
      throw new Error(`Failed to fetch file from GitHub: ${getResponse.status}`)
    }

    // Step 2: Encode content to Base64
    const encodedContent = Buffer.from(content).toString('base64')

    // Step 3: PUT request to update/create the file on GitHub
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    
    const putBody: any = {
      message: commitMessage || `Update ${path}`,
      content: encodedContent,
      branch: 'main' // You can make this configurable
    }

    // Include SHA if file exists (required for updates)
    if (sha) {
      putBody.sha = sha
    }

    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Neural-Memory-App'
      },
      body: JSON.stringify(putBody)
    })

    if (!putResponse.ok) {
      const errorData = await putResponse.json()
      throw new Error(`GitHub update failed: ${errorData.message || putResponse.status}`)
    }

    const githubResult = await putResponse.json()
    console.log(`✅ GitHub updated successfully: ${githubResult.commit.sha}`)

    // Step 4: Update Supabase code_memories table
    const { error: updateError } = await supabase
      .from('code_memories')
      .update({
        content: content,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('file_path', path)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      // Don't fail the request if Supabase update fails
      // GitHub update succeeded, which is primary
      return NextResponse.json({
        success: true,
        message: 'File updated on GitHub, but Supabase sync failed',
        githubCommit: githubResult.commit.sha,
        supabaseError: updateError.message
      })
    }

    console.log(`✅ Supabase updated successfully`)

    return NextResponse.json({
      success: true,
      message: 'File updated successfully on GitHub and synced to Supabase',
      githubCommit: githubResult.commit.sha,
      filePath: path
    })

  } catch (error: any) {
    console.error('Push error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
