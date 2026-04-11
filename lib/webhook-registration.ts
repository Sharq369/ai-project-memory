// lib/webhook-registration.ts
// ─────────────────────────────────────────────────────────────────────────────
// The "Flare Gun" — fires when a project is created.
// Parses the repo URL, fetches + decrypts the user's PAT, then hits the
// provider API to register a webhook pointing at /api/webhooks/git.
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
// Accepts any of these formats:
//   https://github.com/owner/repo
//   https://github.com/owner/repo.git
//   owner/repo  (shorthand)
export type Provider = 'github' | 'gitlab' | 'bitbucket'

export interface ParsedRepo {
  provider: Provider
  owner: string
  repo: string
  fullName: string // "owner/repo"
}

export function parseRepoUrl(url: string): ParsedRepo | null {
  const trimmed = url.trim().replace(/\.git$/, '')

  // Detect provider from full URL
  if (trimmed.includes('github.com')) {
    const match = trimmed.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/)
    if (!match) return null
    return { provider: 'github', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  if (trimmed.includes('gitlab.com')) {
    const match = trimmed.match(/gitlab\.com[/:]([\w.-]+(?:\/[\w.-]+)*)\/([\w.-]+)/)
    if (!match) return null
    return { provider: 'gitlab', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  if (trimmed.includes('bitbucket.org')) {
    const match = trimmed.match(/bitbucket\.org[/:]([\w.-]+)\/([\w.-]+)/)
    if (!match) return null
    return { provider: 'bitbucket', owner: match[1], repo: match[2], fullName: `${match[1]}/${match[2]}` }
  }

  // Shorthand "owner/repo" — default to GitHub
  const shorthand = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/)
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
  skipped?: boolean // true if no token — not an error, just not possible
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
    const existing = hooks.find((h: any) => h.config?.url === webhookUrl)
    if (existing) {
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
      events: ['workflow_run', 'push'], // workflow_run for CI/CD repos, push as fallback for repos without CI/CD
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

  // Check for existing hook
  const listRes = await fetch(
    `https://gitlab.com/api/v4/projects/${encodedRepo}/hooks`,
    { headers: { 'PRIVATE-TOKEN': token } }
  )

  if (listRes.ok) {
    const hooks = await listRes.json()
    const existing = hooks.find((h: any) => h.url === webhookUrl)
    if (existing) {
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
      pipeline_events: true, // CI/CD gatekeeper — fires on pipeline events
      push_events: false,
      enable_ssl_verification: true,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || `HTTP ${res.status}`
    console.error(`[WebhookReg] GitLab hook creation failed: ${msg}`)
    return { success: false, provider: 'gitlab', message: `GitLab: ${msg}` }
  }

  const hook = await res.json()
  return { success: true, provider: 'gitlab', hookId: hook.id, message: 'GitLab webhook registered.' }
}

// ── Bitbucket Webhook Registration ───────────────────────────────────────────
// Bitbucket token column stores "username:app_password" Base64 encoded
async function registerBitbucketWebhook(
  parsed: ParsedRepo,
  token: string,
  webhookUrl: string,
): Promise<RegistrationResult> {
  // token is stored as "username:app_password" — use as Basic auth
  const authHeader = `Basic ${Buffer.from(token).toString('base64')}`

  // Check for existing hook
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
        events: ['repo:build_status_created'], // CI/CD gatekeeper
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message || `HTTP ${res.status}`
    console.error(`[WebhookReg] Bitbucket hook creation failed: ${msg}`)
    return { success: false, provider: 'bitbucket', message: `Bitbucket: ${msg}` }
  }

  const hook = await res.json()
  return { success: true, provider: 'bitbucket', hookId: hook.uuid, message: 'Bitbucket webhook registered.' }
}

// ── Main Export: fireFlareGun ─────────────────────────────────────────────────
// Call this after a project row is created in Supabase.
// It will:
//   1. Parse the repo URL to get provider + owner/repo
//   2. Fetch + decrypt the user's PAT for that provider
//   3. Register the webhook on the provider
//   4. Return a result (never throws — errors are logged and returned)
//
// If the user has no token for the detected provider, it returns
// { skipped: true } — this is NOT an error, just informational.

export async function fireFlareGun(
  userId: string,
  repoUrl: string
): Promise<RegistrationResult> {
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://ai-project-memory.vercel.app'

  const webhookUrl = `${APP_DOMAIN}/api/webhooks/git`
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
    console.log(`[WebhookReg] No ${parsed.provider} token for user ${userId} — skipping auto-registration.`)
    return {
      success: false,
      provider: parsed.provider,
      skipped: true,
      message: `No ${parsed.provider} token stored. Webhook not registered.`,
    }
  }

  // Step 3: Register webhook
  console.log(`[WebhookReg] Firing flare gun for ${parsed.fullName} via ${parsed.provider}`)

  try {
    switch (parsed.provider) {
      case 'github':
        return await registerGitHubWebhook(parsed, token, webhookUrl, webhookSecret)
      case 'gitlab':
        return await registerGitLabWebhook(parsed, token, webhookUrl, webhookSecret)
      case 'bitbucket':
        return await registerBitbucketWebhook(parsed, token, webhookUrl)
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
}
