import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Helper function to verify HMAC signatures for GitHub and Bitbucket
function verifyHmac(payload: string, signature: string, secret: string) {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')
    return crypto.timingSafeEqual(Buffer.from('sha256=' + digest), Buffer.from(signature))
  } catch (error) {
    return false
  }
}

export async function POST(req: Request) {
  try {
    // 1. Get the raw body text (required for signature verification)
    const body = await req.text()
    const payload = JSON.parse(body)
    
    // 2. Extract Headers to identify the source
    const githubSig = req.headers.get('x-hub-signature-256')
    const gitlabToken = req.headers.get('x-gitlab-token')
    const userAgent = req.headers.get('user-agent') || ''

    let isValid = false
    let provider: 'github' | 'gitlab' | 'bitbucket' = 'github'
    let repoPath = ''

    // 3. ROUTING & SECURITY VERIFICATION
    if (githubSig && userAgent.includes('GitHub')) {
      // GitHub Verification (uses WEBHOOK_SECRET)
      isValid = verifyHmac(body, githubSig, process.env.WEBHOOK_SECRET || '')
      provider = 'github'
      repoPath = payload.repository?.full_name
    } 
    else if (gitlabToken) {
      // GitLab Verification (uses WEBHOOK_SECRET as a plain token)
      isValid = gitlabToken === process.env.WEBHOOK_SECRET
      provider = 'gitlab'
      repoPath = payload.project?.path_with_namespace
    } 
    else if (githubSig && userAgent.includes('Bitbucket')) {
      // Bitbucket Verification (uses BITBUCKET_WEBHOOK_SECRET)
      isValid = verifyHmac(body, githubSig, process.env.BITBUCKET_WEBHOOK_SECRET || '')
      provider = 'bitbucket'
      repoPath = payload.repository?.full_name 
    }

    // Reject unauthorized or unrecognized requests
    if (!isValid) {
      console.error(`[Webhook] Unauthorized request from User-Agent: ${userAgent}`)
      return NextResponse.json({ error: 'Unauthorized signature' }, { status: 401 })
    }

    if (!repoPath) {
      return NextResponse.json({ error: 'Could not determine repository name' }, { status: 400 })
    }

    // 4. DATABASE LOOKUP
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Match the incoming repo to your database using your verified column
    const { data: project, error: dbError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('repo_full_name', repoPath) 
      .single()

    if (dbError || !project) {
      console.log(`[Webhook] Repo matched, but no project found in DB for: ${repoPath}`)
      return NextResponse.json({ message: 'Repo not linked to a project' }, { status: 200 })
    }

    // 5. TRIGGER BACKGROUND SYNC
    // Determine the base URL dynamically so it works in dev and production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`
    
    // "Fire and forget" fetch - we don't await this so the webhook responds to Git immediately
    fetch(`${baseUrl}/api/sync/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        repo: repoPath, 
        projectId: project.id, 
        userId: project.user_id 
      })
    }).catch(err => console.error(`[Webhook] Failed to trigger sync route:`, err))

    return NextResponse.json({ 
      success: true, 
      message: `Triggered ${provider} sync for ${repoPath}` 
    })

  } catch (err: any) {
    console.error('[Webhook] Internal Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
