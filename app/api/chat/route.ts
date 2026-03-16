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
    // 3. Fetch code memories
    const { data: memories, error } = await supabase
      .from('code_memories')
      .select('file_name, content')
      .eq('project_id', projectId)

    if (error) throw error

    let contextString = 'No files synced yet.'
    let fileCount = 0;
    let fileNamesList = 'None';

    if (memories && memories.length > 0) {
      fileCount = memories.length;
      fileNamesList = memories.map(m => m.file_name).join(', ');
      
      contextString = memories
        .map(m => `### FILE: ${m.file_name}\n\`\`\`\n${m.content}\n\`\`\``)
        .join('\n\n')
    }

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemPrompt = `You are the dedicated AI assistant and expert guide for this specific project. 
Your goal is to help the user understand, navigate, and interact with this codebase.

PROJECT FACTS (Use these as absolute truth):
- Total number of files: ${fileCount}
- List of files: ${fileNamesList}

CRITICAL INSTRUCTIONS:
- You are a knowledgeable guide FOR THIS PROJECT ONLY. Discuss it naturally with the user.
- If the user asks for the file count, reply directly with the exact number provided above (${fileCount}). DO NOT try to count the files yourself.
- If the user asks what files are in the project, refer to the list of files provided above.
- Answer coding questions strictly based on the provided CODEBASE CONTEXT.
- If the user asks for code, output the code blocks with clear, technical explanations.

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
