import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { getAdminAuth, getAdminDb } from './_lib/firebaseAdmin.js'
import { buildSystemPrompt, sanitizeTransits, type NatalChartLike } from './_lib/companionPrompt.js'

// OpenAI round trips run longer than the 10s default.
export const config = { maxDuration: 30 }

/**
 * Unlike /api/forecast -- which calls OpenAI once a day and caches the result
 * for everybody -- this is billed per person per message, so it needs real
 * limits. A daily cap keeps a runaway loop or a bored subscriber from costing
 * more than their subscription brings in.
 */
const DAILY_MESSAGE_LIMIT = 20
const MAX_QUESTION_CHARS = 600
const MAX_HISTORY_MESSAGES = 6
const REQUIRED_TIER = 'all_access'

interface HistoryTurn {
  role: 'user' | 'assistant'
  content: string
}

async function uidFromRequest(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  const idToken = header.slice('Bearer '.length).trim()
  if (!idToken) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    return decoded.uid
  } catch {
    return null
  }
}

/** Keeps only well-formed turns, and trims each one so history can't balloon the prompt. */
function sanitizeHistory(raw: unknown): HistoryTurn[] {
  if (!Array.isArray(raw)) return []
  const turns: HistoryTurn[] = []
  for (const item of raw.slice(-MAX_HISTORY_MESSAGES)) {
    if (!item || typeof item !== 'object') continue
    const t = item as Record<string, unknown>
    const role = t.role === 'assistant' ? 'assistant' : t.role === 'user' ? 'user' : null
    const content = typeof t.content === 'string' ? t.content.slice(0, MAX_QUESTION_CHARS) : ''
    if (!role || !content.trim()) continue
    turns.push({ role, content })
  }
  return turns
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const uid = await uidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Not signed in' })
    return
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION_CHARS) : ''
  if (!question) {
    res.status(400).json({ error: 'Ask a question first.' })
    return
  }

  try {
    const db = getAdminDb()

    // Tier is read server-side from Firestore, never trusted from the client.
    const userSnap = await db.collection('users').doc(uid).get()
    if ((userSnap.data()?.tier ?? 'free') !== REQUIRED_TIER) {
      res.status(403).json({ error: 'The chart companion is part of All Access.' })
      return
    }

    const chartSnap = await db.collection('natalCharts').doc(uid).get()
    const chart = chartSnap.data()?.chart as NatalChartLike | undefined
    if (!chart || !Array.isArray(chart.points) || chart.points.length === 0) {
      res.status(409).json({ error: 'Save your birth chart first — the companion reads from it.' })
      return
    }

    // Daily cap, counted per UTC day.
    const usageRef = db.collection('companionUsage').doc(uid)
    const usageSnap = await usageRef.get()
    const usage = usageSnap.data()
    const today = todayKey()
    const usedToday = usage?.date === today ? Number(usage.count ?? 0) : 0
    if (usedToday >= DAILY_MESSAGE_LIMIT) {
      res.status(429).json({
        error: `That's ${DAILY_MESSAGE_LIMIT} questions today — the companion resets tomorrow.`,
      })
      return
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(503).json({ error: 'The companion is not configured yet.' })
      return
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(chart, sanitizeTransits(body.transits)) },
        ...sanitizeHistory(body.history),
        { role: 'user', content: question },
      ],
      max_tokens: 420,
      temperature: 0.7,
    })

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) {
      res.status(502).json({ error: 'The companion had nothing to say — try rephrasing.' })
      return
    }

    await usageRef.set({ date: today, count: usedToday + 1, updatedAt: new Date().toISOString() })

    res.status(200).json({
      answer,
      remaining: Math.max(0, DAILY_MESSAGE_LIMIT - (usedToday + 1)),
    })
  } catch (err) {
    console.error('companion handler error', err)
    res.status(500).json({ error: 'The companion is having a moment — try again shortly.' })
  }
}
