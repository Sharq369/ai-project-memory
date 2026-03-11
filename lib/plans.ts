// lib/plans.ts
// Single source of truth for all plan limits across the app

export type PlanType = 'free' | 'pro' | 'platinum'

export const PLAN_LIMITS = {
  free: {
    projects: 3,
    filesPerSync: 10,
    aiMessagesPerDay: 10,
    providers: ['github'] as string[],
    webhookAutoSync: false,
    privateRepos: false,
    dataExport: false,
  },
  pro: {
    projects: 20,
    filesPerSync: 100,
    aiMessagesPerDay: 200,
    providers: ['github', 'gitlab', 'bitbucket'] as string[],
    webhookAutoSync: true,
    privateRepos: true,
    dataExport: true,
  },
  platinum: {
    projects: Infinity,
    filesPerSync: Infinity,
    aiMessagesPerDay: Infinity,
    providers: ['github', 'gitlab', 'bitbucket'] as string[],
    webhookAutoSync: true,
    privateRepos: true,
    dataExport: true,
  },
} as const

export function getLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  platinum: 'Platinum',
}
