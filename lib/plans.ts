// lib/plans.ts
// Single source of truth for all plan limits across the app.
// Updated to include: Decomposer, Memories vault, Tags, and new sync features.

export type PlanType = 'free' | 'pro' | 'platinum'

// Developer bypass — these user IDs get Platinum access on all checks
export const DEVELOPER_IDS: string[] = [
  '33157b98-fdd0-4e04-b14b-bee4352f80c7', // SHARQ
]

export const PLAN_LIMITS = {
  free: {
    // ── Projects & Sync ───────────────────────────────────────
    projects: 3,
    filesPerSync: 10,
    providers: ['github'] as string[],
    webhookAutoSync: false,
    privateRepos: false,

    // ── AI Chat (per project) ─────────────────────────────────
    aiMessagesPerDay: 10,

    // ── Decomposer ────────────────────────────────────────────
    // Number of PRD decompositions per day
    decomposerRunsPerDay: 2,
    // Can access decomposer at all
    decomposerAccess: true,

    // ── Memories Vault ────────────────────────────────────────
    // Max total memories a user can store
    memoriesLimit: 20,
    // Can edit memory content after saving
    memoryEdit: false,
    // Can add tags/labels to memories
    memoryTagging: true,

    // ── Export ───────────────────────────────────────────────
    dataExport: false,
  },

  pro: {
    // ── Projects & Sync ───────────────────────────────────────
    projects: 20,
    filesPerSync: 100,
    providers: ['github', 'gitlab', 'bitbucket'] as string[],
    webhookAutoSync: true,
    privateRepos: true,

    // ── AI Chat ───────────────────────────────────────────────
    aiMessagesPerDay: 200,

    // ── Decomposer ────────────────────────────────────────────
    decomposerRunsPerDay: 20,
    decomposerAccess: true,

    // ── Memories Vault ────────────────────────────────────────
    memoriesLimit: 200,
    memoryEdit: true,
    memoryTagging: true,

    // ── Export ───────────────────────────────────────────────
    dataExport: true,
  },

  platinum: {
    // ── Projects & Sync ───────────────────────────────────────
    projects: Infinity,
    filesPerSync: Infinity,
    providers: ['github', 'gitlab', 'bitbucket'] as string[],
    webhookAutoSync: true,
    privateRepos: true,

    // ── AI Chat ───────────────────────────────────────────────
    aiMessagesPerDay: Infinity,

    // ── Decomposer ────────────────────────────────────────────
    decomposerRunsPerDay: Infinity,
    decomposerAccess: true,

    // ── Memories Vault ────────────────────────────────────────
    memoriesLimit: Infinity,
    memoryEdit: true,
    memoryTagging: true,

    // ── Export ───────────────────────────────────────────────
    dataExport: true,
  },
} as const

export function getLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

// Use this in every API route before performing a gated action
export function isDeveloper(userId: string): boolean {
  return DEVELOPER_IDS.includes(userId)
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro — $19/mo',
  platinum: 'Platinum — $49/mo',
}

export const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  free: '3 projects · 10 files/sync · 2 decompositions/day · 20 memories',
  pro: '20 projects · 100 files/sync · 20 decompositions/day · 200 memories',
  platinum: 'Unlimited everything · Private repos · Webhook auto-sync',
}
