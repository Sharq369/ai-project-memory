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
      const startOfDay = new Date()
      startOfDay.setUTCHours(0, 0, 0, 0)

      const { count } = await adminSupabase
        .from('ai_message_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())

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

    let contextString = 'No files synced yet.'
    if (memories && memories.length > 0) {
      contextString = memories
        .map(m => `### FILE: ${m.file_name}\n\`\`\`\n${m.content}\n\`\`\``)
        .join('\n\n')
    }

    // 4. Call Gemini (USING CORRECTED MODEL NAME)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemPrompt = `You are a senior, highly technical software engineer assisting a colleague.
You are answering questions strictly based on the provided CODEBASE CONTEXT.

CRITICAL INSTRUCTIONS:
- DO NOT use preambles, greetings, or conversational filler.
- NEVER say "Here is the rewritten code", "Certainly!", "Sure thing", or "I can help with that."
- If the user asks for code, output ONLY the code blocks and brief, technical inline comments explaining the changes.
- Do not wrap the code block in unnecessary explanations before or after.
- Be ruthlessly concise, direct, and authoritative. 

CODEBASE CONTEXT:
${contextString}`

    const result = await model.generateContent([systemPrompt, query])
    const responseText = result.response.text()

    return NextResponse.json({ response: responseText })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
