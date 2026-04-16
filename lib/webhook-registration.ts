// lib/webhook-registration.ts
// ─────────────────────────────────────────────────────────────────────────────
// The "Flare Gun" — fires when a project is created OR when manually triggered.
//
// FIX: After registering a webhook, we now also stamp repo_full_name on the
// project row immediately. Previously this was only saved during a manual sync,
// meaning projects created before a sync would fail the 3-pass webhook lookup
// (Pass 1 checks repo_full_name — if null, GitHub deliveries returned
// "Node not found, ignoring." and auto-sync never fired).
//
// Supports: GitHub, GitLab, Bitbucket
// Encryption: AES-256-CBC (matches app/api/user/tokens/route.ts)
// ─────────────────────────────────────────────────────────────────────────────

import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ── Supabase admin client (service role — bypasses RLS) ───────────────────────
const getAdminSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// ── Decryption — mirrors encrypt() in app/api/user/tokens/route.ts ───────────
const RAW_DECRYPT_KEY = process.env.ENCRYPTION_KEY || 'NeuralNodeDefaultKey_MustChange!!'
const ENCRYPTION_KEY = Buffer.alloc(32)
Buffer.from(RAW_DECRYPT_KEY).copy(ENCRYPTION_KEY)

function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':')
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted token format')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// ── Repo URL Parser ───────────────────────────────────────────────────────────
export type Provider = 'github' | 'gitlab' | 'bitbucket'

export interface ParsedRepo {
  provider: Provider
  owner: string
  repo: string
  fullName: string // "owner/repo"
}

export function parseRepoUrl(url: string): ParsedRepo | null {
  const trimmed = url.trim().replace(/\.git$/, '')

  if (trimmed.includes('github.com')) {
    const match = trimmed.match(/github\.com[/:]([\\w.-]+)\/([\\w.-]+)/)
    if (!match) return null
    return { provider: 'github', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  if (trimmed.includes('gitlab.com')) {
    const match = trimmed.match(/gitlab\.com[/:]([\\w.-]+(?:\/[\\w.-]+)*)\/([\\w.-]+)/)
    if (!match) return null
    return { provider: 'gitlab', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  if (trimmed.includes('bitbucket.org')) {
    const match = trimmed.match(/bitbucket\.org[/:]([\\w.-]+)\/([\\w.-]+)/)
    if (!match) return null
    return { provider: 'bitbucket', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  // Shorthand "owner/repo" — default to GitHub
  const shorthand = trimmed.match(/^([\\w.-]+)\/([\\w.-]+)$/)
  if (shorthand) {
    return { provider: 'github', owner: shorthand[1], repo: shorthand[2], fullName: trimmed }
  }

  return null
}

// ── Token Fetcher ─────────────────────────────────────────────────────────────
async function getDecryptedToken(userId: string, provider: Provider): Promise<string | null> {
  const supabase = getAdminSupabase()
  const column = `${provider}_token`

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(column)
    .eq('id', userId)
    .single()

  if (error || !profile) return null

  const encryptedToken = profile[column] as string | null
  if (!encryptedToken) return null

  try {
    return decrypt(encryptedToken)
  } catch (e) {
    console.error(`[WebhookReg] Failed to decrypt ${provider} token for user ${userId}:`, e)
    return null
  }
}

// ── Registration Result ───────────────────────────────────────────────────────
export interface RegistrationResult {
  success: boolean
  provider: Provider
  hookId?: string | number
  message: string
  skipped?: boolean
}

// ── GitHub Webhook Registration ───────────────────────────────────────────────
async function registerGitHubWebhook(
  parsed: ParsedRepo,
  token: string,
  webhookUrl: string,
  secret: string
): Promise<RegistrationResult> {
  // Check if webhook already exists to avoid duplicates
  const listRes = await fetch(
    `https://api.github.com/repos/${parsed.fullName}/hooks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )

  if (listRes.ok) {
    const hooks = await listRes.json()
    // Match by base URL (ignore query params) to catch old registrations without bypass token
    const existing = hooks.find((h: any) => {
      const hookBase = (h.config?.url || '').split('?')[0]
      const targetBase = webhookUrl.split('?')[0]
      return hookBase === targetBase
    })
    if (existing) {
      // If URL has changed (bypass token added/changed), update the webhook
      if (existing.config?.url !== webhookUrl) {
        await fetch(
          `https://api.github.com/repos/${parsed.fullName}/hooks/${existing.id}`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: { url: webhookUrl, content_type: 'json', secret: secret, insecure_ssl: '0' } })
          }
        )
        return { success: true, provider: 'github', hookId: existing.id, message: 'Webhook URL updated with bypass token.' }
      }
      return { success: true, provider: 'github', hookId: existing.id, message: 'Webhook already registered.' }
    }
  }

  const res = await fetch(`https://api.github.com/repos/${parsed.fullName}/hooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['workflow_run', 'push'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: secret,
        insecure_ssl: '0',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || `HTTP ${res.status}`
    console.error(`[WebhookReg] GitHub hook creation failed: ${msg}`)
    return { success: false, provider: 'github', message: `GitHub: ${msg}` }
  }

  const hook = await res.json()
  return { success: true, provider: 'github', hookId: hook.id, message: 'GitHub webhook registered.' }
}

// ── GitLab Webhook Registration ───────────────────────────────────────────────
async function registerGitLabWebhook(
  parsed: ParsedRepo,
  token: string,
  webhookUrl: string,
  secret: string
): Promise<RegistrationResult> {
  const encodedRepo = encodeURIComponent(parsed.fullName)

  const listRes = await fetch(
    `https://gitlab.com/api/v4/projects/${encodedRepo}/hooks`,
    { headers: { 'PRIVATE-TOKEN': token } }
  )

  if (listRes.ok) {
    const hooks = await listRes.json()
    const existing = hooks.find((h: any) => {
      const hookBase = (h.url || '').split('?')[0]
      const targetBase = webhookUrl.split('?')[0]
      return hookBase === targetBase
    })
    if (existing) {
      if (existing.url !== webhookUrl) {
        await fetch(
          `https://gitlab.com/api/v4/projects/${encodeURIComponent(parsed.fullName)}/hooks/${existing.id}`,
          {
            method: 'PUT',
            headers: { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl, push_events: true, pipeline_events: true, token: secret })
          }
        )
        return { success: true, provider: 'gitlab', hookId: existing.id, message: 'Webhook URL updated with bypass token.' }
      }
      return { success: true, provider: 'gitlab', hookId: existing.id, message: 'Webhook already registered.' }
    }
  }

  const res = await fetch(`https://gitlab.com/api/v4/projects/${encodedRepo}/hooks`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      token: secret,
      pipeline_events: true,
      push_events: false,
      enable_ssl_verification: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || `HTTP ${res.status}`
    return { success: false, provider: 'gitlab', message: `GitLab: ${msg}` }
  }

  const hook = await res.json()
  return { success: true, provider: 'gitlab', hookId: hook.id, message: 'GitLab webhook registered.' }
}

// ── Bitbucket Webhook Registration ────────────────────────────────────────────
async function registerBitbucketWebhook(
  parsed: ParsedRepo,
  token: string,
  webhookUrl: string,
): Promise<RegistrationResult> {
  const authHeader = `Basic ${Buffer.from(token).toString('base64')}`

  const listRes = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${parsed.fullName}/hooks`,
    { headers: { Authorization: authHeader } }
  )

  if (listRes.ok) {
    const data = await listRes.json()
    const existing = data.values?.find((h: any) => h.url === webhookUrl)
    if (existing) {
      return { success: true, provider: 'bitbucket', hookId: existing.uuid, message: 'Webhook already registered.' }
    }
  }

  const res = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${parsed.fullName}/hooks`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Neural Node CI/CD Sync',
        url: webhookUrl,
        active: true,
        events: ['repo:build_status_created'],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    return { success: false, provider: 'bitbucket', message: `Bitbucket: ${msg}` }
  }

  const hook = await res.json()
  return { success: true, provider: 'bitbucket', hookId: hook.uuid, message: 'Bitbucket webhook registered.' }
}

// ── Main Export: fireFlareGun ─────────────────────────────────────────────────
// FIX: Now accepts an optional projectId. When provided, it stamps repo_full_name
// AND provider onto the project row immediately after successful registration.
// This ensures the 3-pass webhook lookup in /api/webhooks/git/route.ts always
// finds the project on Pass 1 (exact repo_full_name match), preventing the
// silent "Node not found, ignoring." failure that blocked auto-sync.

export async function fireFlareGun(
  userId: string,
  repoUrl: string,
  projectId?: string  // ← NEW: optional, stamp repo_full_name if provided
): Promise<RegistrationResult> {
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://ai-project-memory.vercel.app'

  // Vercel Deployment Protection bypass — required for GitHub/GitLab/Bitbucket
  // webhooks since they cannot set custom headers. Uses query parameter approach
  // as recommended by Vercel docs for third-party webhook services.
  // VERCEL_AUTOMATION_BYPASS_SECRET is auto-set by Vercel when you create the secret
  // in Settings → Deployment Protection → Protection Bypass for Automation.
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  const webhookUrl = bypassSecret
    ? `${APP_DOMAIN}/api/webhooks/git?x-vercel-protection-bypass=${bypassSecret}`
    : `${APP_DOMAIN}/api/webhooks/git`
  const webhookSecret = process.env.WEBHOOK_SECRET || ''

  // Step 1: Parse repo URL
  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    return {
      success: false,
      provider: 'github',
      message: `Could not parse repo URL: "${repoUrl}"`,
    }
  }

  // Step 2: Fetch decrypted token
  const token = await getDecryptedToken(userId, parsed.provider)
  if (!token) {
    console.log(`[WebhookReg] No ${parsed.provider} token for user ${userId} — skipping.`)
    return {
      success: false,
      provider: parsed.provider,
      skipped: true,
      message: `No ${parsed.provider} token stored. Webhook not registered.`,
    }
  }

  // Step 3: Register webhook on provider
  console.log(`[WebhookReg] Firing flare gun for ${parsed.fullName} via ${parsed.provider}`)

  let result: RegistrationResult

  try {
    switch (parsed.provider) {
      case 'github':
        result = await registerGitHubWebhook(parsed, token, webhookUrl, webhookSecret)
        break
      case 'gitlab':
        result = await registerGitLabWebhook(parsed, token, webhookUrl, webhookSecret)
        break
      case 'bitbucket':
        result = await registerBitbucketWebhook(parsed, token, webhookUrl)
        break
      default:
        return { success: false, provider: parsed.provider, message: 'Unknown provider.' }
    }
  } catch (e: any) {
    console.error(`[WebhookReg] Unexpected error:`, e)
    return {
      success: false,
      provider: parsed.provider,
      message: e.message || 'Unexpected error during webhook registration.',
    }
  }

  // ── FIX: Stamp repo_full_name + provider on the project row ──────────────
  // This is the critical fix. Previously only webhook_registered was saved here.
  // Without repo_full_name, the webhook lookup in /api/webhooks/git/route.ts
  // would fail Pass 1 and the auto-sync would never fire for that project.
  if (result.success && projectId) {
    const supabase = getAdminSupabase()
    const { error: stampError } = await supabase
      .from('projects')
      .update({
        webhook_registered: true,
        repo_full_name: parsed.fullName,   // ← THE FIX
        provider: parsed.provider,          // ← also stamp provider for sync routing
      })
      .eq('id', projectId)

    if (stampError) {
      console.error(`[WebhookReg] Failed to stamp repo_full_name on project ${projectId}:`, stampError.message)
      // Don't fail the result — webhook was registered, just log the stamp error
    } else {
      console.log(`[WebhookReg] Stamped repo_full_name="${parsed.fullName}" on project ${projectId}`)
    }
  }

  return result
}
