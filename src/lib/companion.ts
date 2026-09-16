import { ensureAnonymousUser } from './firebase'
import { loadNatalChart } from './natalStorage'
import { findTransits } from './transits'

export interface CompanionTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface CompanionReply {
  answer: string
  remaining: number
}

/**
 * Today's tightest transits, sent along so the companion can answer "what's
 * moving for me right now" without the server recomputing astronomy. The
 * server validates every field against a whitelist before it reaches the
 * prompt, so this is a convenience, not a trust boundary.
 */
async function todaysTransits() {
  try {
    const chart = await loadNatalChart()
    if (!chart) return []
    return findTransits(chart)
      .slice(0, 6)
      .map(({ transitingPlanet, natalPoint, aspect, nature, orb }) => ({
        transitingPlanet,
        natalPoint,
        aspect,
        nature,
        orb: Math.round(orb * 10) / 10,
      }))
  } catch (err) {
    console.error('Could not compute transits for the companion', err)
    return []
  }
}

export async function askCompanion(question: string, history: CompanionTurn[]): Promise<CompanionReply> {
  const user = await ensureAnonymousUser()
  const idToken = await user.getIdToken()

  const res = await fetch('/api/companion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ question, history, transits: await todaysTransits() }),
  })

  const data = (await res.json().catch(() => ({}))) as { answer?: string; remaining?: number; error?: string }
  if (!res.ok) throw new Error(data.error || 'The companion is unavailable right now.')

  return { answer: data.answer ?? '', remaining: typeof data.remaining === 'number' ? data.remaining : 0 }
}
