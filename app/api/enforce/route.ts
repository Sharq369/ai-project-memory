// app/api/enforce/route.ts
// Central gatekeeper for all plan-limited actions.
// Call this from the frontend BEFORE any gated action.
//
// Actions supported:
//   create_project     — before creating a new project
//   ai_message         — before sending a chat message
//   decomposer_run     — before running the PRD decomposer
//   add_memory         — before saving a new memory
//   edit_memory        — before editing memory content
//   sync               — before syncing a repo (provider check handled in sync routes)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLimits, isDeveloper, PlanType } from '../../../lib/plans'

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

    // Developer bypass — always allowed at Platinum level
    if (isDeveloper(userId)) {
      return NextResponse.json({ allowed: true, plan: 'platinum' })
    }

    // Get user plan from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    const plan = (profile?.plan_type as PlanType) || 'free'
    const limits = getLimits(plan)

    // ── CREATE PROJECT ─────────────────────────────────────────────────────────
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
          allowed: false, plan, upgrade: true,
          reason: `Your ${plan} plan allows ${limits.projects} projects. Upgrade to create more.`
        })
      }
    }

    // ── AI CHAT MESSAGE ────────────────────────────────────────────────────────
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
          allowed: false, plan, upgrade: true,
          reason: `Daily AI limit: ${limits.aiMessagesPerDay} messages on ${plan} plan. Resets at midnight.`
        })
      }

      // Log this message
      await supabase.from('ai_message_log').insert({ user_id: userId })
    }

    // ── DECOMPOSER RUN ─────────────────────────────────────────────────────────
    if (action === 'decomposer_run') {
      if (!limits.decomposerAccess) {
        return NextResponse.json({
          allowed: false, plan, upgrade: true,
          reason: `Decomposer is not available on your plan. Upgrade to access it.`
        })
      }

      if (limits.decomposerRunsPerDay === Infinity) {
        return NextResponse.json({ allowed: true, plan })
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('decomposer_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= limits.decomposerRunsPerDay) {
        return NextResponse.json({
          allowed: false, plan, upgrade: true,
          reason: `Daily decomposer limit: ${limits.decomposerRunsPerDay} runs on ${plan} plan. Resets at midnight.`
        })
      }

      // Log this decomposer run
      await supabase.from('decomposer_log').insert({ user_id: userId })
    }

    // ── ADD MEMORY ─────────────────────────────────────────────────────────────
    if (action === 'add_memory') {
      if (limits.memoriesLimit === Infinity) {
        return NextResponse.json({ allowed: true, plan })
      }

      const { count } = await supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      if ((count ?? 0) >= limits.memoriesLimit) {
        return NextResponse.json({
          allowed: false, plan, upgrade: true,
          reason: `Memory vault full: ${limits.memoriesLimit} memories on ${plan} plan. Upgrade to store more.`
        })
      }
    }

    // ── EDIT MEMORY ────────────────────────────────────────────────────────────
    if (action === 'edit_memory') {
      if (!limits.memoryEdit) {
        return NextResponse.json({
          allowed: false, plan, upgrade: true,
          reason: `Memory editing is not available on the free plan. Upgrade to Pro to edit memories.`
        })
      }
    }

    return NextResponse.json({ allowed: true, plan })

  } catch (err: any) {
    console.error('Enforce error:', err)
    return NextResponse.json({ allowed: false, reason: 'Server error' }, { status: 500 })
  }
}
