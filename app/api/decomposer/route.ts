// app/api/decomposer/route.ts
// Server-side proxy for all Decomposer AI calls.
// Keeps GEMINI_API_KEY out of the browser entirely.

import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Missing or invalid prompt.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY // ← server-only, no NEXT_PUBLIC_
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured on server.' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // ← FIXED

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ text })

  } catch (error: any) {
    console.error('Decomposer API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
