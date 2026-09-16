import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { getAdminDb } from './_lib/firebaseAdmin.js'

// Generates ONE AI reading per calendar day (UTC), cached in Firestore.
// Every visitor that day gets the same cached text -- this endpoint calls
// OpenAI at most once per day regardless of traffic, which keeps cost
// predictable on a fixed API credit budget.

interface ForecastInput {
  moonPhase: string
  illuminationPct: number
  moonSign: string
  retrogradePlanets: string[]
  quakeMaxMagnitude: number | null
  quakeCount24h: number
  geomagneticStatus: string
  geomagneticKIndex: number | null
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD, UTC
}

function buildPrompt(input: ForecastInput): string {
  return `You write the daily "LunaAura" reading -- a warm, grounded, non-clinical
nervous-system reflection tied to real astronomical and geophysical data.
Voice: warm, direct, zero fluff, zero fear-mongering, zero medical claims.
Never claim certainty about causation between these events and someone's body;
frame it as an intuitive lens, not a diagnosis.

Today's real data:
- Moon phase: ${input.moonPhase} (${input.illuminationPct}% illuminated), Moon in ${input.moonSign}
- Retrograde planets: ${input.retrogradePlanets.length ? input.retrogradePlanets.join(', ') : 'none'}
- Earthquakes (last 24h, M2.5+): ${input.quakeCount24h}, strongest magnitude ${input.quakeMaxMagnitude ?? 'n/a'}
- Geomagnetic activity: ${input.geomagneticStatus} (Kp ${input.geomagneticKIndex ?? 'n/a'})

Write 3 short paragraphs (under 140 words total):
1. A one-line theme for today.
2. What this specific combination might feel like in the body/nervous system, grounded in the actual data above -- do not invent data.
3. One concrete, doable practice for today.

Plain text only, no headers, no markdown, no emoji.`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const input = req.body as ForecastInput
  if (!input || typeof input.moonPhase !== 'string') {
    res.status(400).json({ error: 'Missing forecast input' })
    return
  }

  const dateKey = todayKey()

  try {
    const db = getAdminDb()
    const ref = db.collection('forecasts').doc(dateKey)
    const existing = await ref.get()
    if (existing.exists) {
      res.status(200).json({ text: existing.data()?.text, cached: true })
      return
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(200).json({ text: null, cached: false, reason: 'no_api_key' })
      return
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(input) }],
      max_tokens: 260,
      temperature: 0.8,
    })
    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) {
      res.status(200).json({ text: null, cached: false, reason: 'empty_completion' })
      return
    }

    await ref.set({ text, generatedAt: new Date().toISOString(), input })
    res.status(200).json({ text, cached: false })
  } catch (err) {
    console.error('forecast handler error', err)
    // Fail soft -- the client already has a rule-based fallback reading.
    res.status(200).json({ text: null, cached: false, reason: 'error' })
  }
}
