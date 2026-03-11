// app/api/enforce/route.ts
// Call this from the frontend BEFORE any gated action.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, PlanType } from '../../../lib/plans'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { userId, action } = await req.json()

    if (!userId) {
      return NextResponse.json({ allowed: false, reason: 'Not authenticated' }, { status: 401 })
    }

    // Get user plan from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    const plan = (profile?.plan_type as PlanType) || 'free'
    const limits = getLimits(plan)

    // ── Check: create_project ──────────────────────────────
    if (action === 'create_project') {
      if (limits.projects === Infinity) {
        return NextResponse.json({ allowed: true, plan })
      }

      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      if ((count ?? 0) >= limits.projects) {
        return NextResponse.json({
          allowed: false,
          plan,
          upgrade: true,
          reason: `Your ${plan} plan allows ${limits.projects} projects. Upgrade to create more.`
        })
      }
    }

    // ── Check: ai_message ──────────────────────────────────
    if (action === 'ai_message') {
      if (limits.aiMessagesPerDay === Infinity) {
        return NextResponse.json({ allowed: true, plan })
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('ai_message_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= limits.aiMessagesPerDay) {
        return NextResponse.json({
          allowed: false,
          plan,
          upgrade: true,
          reason: `Daily limit: ${limits.aiMessagesPerDay} messages/day on ${plan} plan. Resets at midnight.`
        })
      }

      await supabase.from('ai_message_log').insert({ user_id: userId })
    }

    return NextResponse.json({ allowed: true, plan })

  } catch (err: any) {
    console.error('Enforce error:', err)
    return NextResponse.json({ allowed: false, reason: 'Server error' }, { status: 500 })
  }
}
