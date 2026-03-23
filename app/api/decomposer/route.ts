// app/api/decomposer/route.ts
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Missing or invalid prompt.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured on server.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Try gemini-2.5-flash first, fall back to gemini-2.0-flash
    let model
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    } catch {
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    }

    const result = await model.generateContent(prompt)
    let text = result.response.text()

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'AI returned an empty response. Try again.' }, { status: 502 })
    }

    // Server-side cleanup: strip markdown fences before sending to client
    // This catches cases where the model ignores the prompt instruction
    text = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return NextResponse.json({ text })

  } catch (error: any) {
    console.error('Decomposer API Error:', error.message)

    // Surface the raw error message to the client for easier debugging
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
