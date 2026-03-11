// app/api/chat/route.ts
// FULL REPLACEMENT — adds AI message daily limit per plan

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getLimits, PlanType } from '../../../lib/plans'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { query, projectId } = await req.json()

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name) { return cookieStore.get(name)?.value } } }
    )

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Get plan + check daily limit
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan_type as PlanType) || 'free'
    const limits = getLimits(plan)

    if (limits.aiMessagesPerDay !== Infinity) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count } = await adminSupabase
        .from('ai_message_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())

      if ((count ?? 0) >= limits.aiMessagesPerDay) {
        return NextResponse.json({
          error: `Daily limit reached: ${limits.aiMessagesPerDay} messages/day on ${plan} plan. Upgrade for more.`
        }, { status: 429 })
      }

      // Log this message
      await adminSupabase.from('ai_message_log').insert({ user_id: user.id })
    }

    // 3. Fetch code memories
    const { data: memories, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (error) throw error

    const contextString = memories?.length
      ? memories.map(m => `### FILE: ${m.file_name}\n${m.content}`).join('\n\n')
      : 'No code files found in this node archive.'

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemPrompt = `
      YOU ARE THE "NEURAL TERMINAL" FOR A VIBE CODER.
      YOUR SOURCE OF TRUTH IS THE FOLLOWING CODEBASE:

      ${contextString}

      STRICT RULES:
      1. Base all answers on the existing files above.
      2. Keep responses concise, technical, and aligned with the Vibe Coder aesthetic.
    `

    const result = await model.generateContent([systemPrompt, query])
    return NextResponse.json({ response: result.response.text() })

  } catch (err: any) {
    return NextResponse.json({ error: 'Neural Link Disrupted: ' + err.message }, { status: 500 })
  }
}
