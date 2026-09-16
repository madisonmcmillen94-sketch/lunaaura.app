/**
 * Prompt construction for the chart companion.
 *
 * Two jobs here, and the second matters as much as the first: build a prompt
 * grounded in the person's real chart, and make sure nothing the client sends
 * can smuggle instructions into it. Everything below is either generated from
 * Firestore data or validated against a fixed whitelist -- no free text from
 * the browser is ever interpolated into the system prompt.
 */

export interface ChartPoint {
  name: string
  sign: string
  degreeInSign: number
  house: number
  retrograde: boolean
}

export interface NatalChartLike {
  input?: { date?: string; placeLabel?: string }
  ascendant?: { sign?: string; degreeInSign?: number }
  midheaven?: { sign?: string; degreeInSign?: number }
  points?: ChartPoint[]
}

export interface SafeTransit {
  transitingPlanet: string
  natalPoint: string
  aspect: string
  nature: string
  orb: number
}

const POINTS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
  'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Ascendant', 'Midheaven',
]
const ASPECTS = ['Conjunction', 'Sextile', 'Square', 'Trine', 'Opposition']
const NATURES = ['harmonious', 'challenging', 'intensifying']
const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

/**
 * Transits are computed in the browser, so they arrive as untrusted input.
 * Each field is checked against a known set and the numbers are re-derived,
 * which means a tampered payload can at worst drop transits -- never inject
 * text into the prompt.
 */
export function sanitizeTransits(raw: unknown): SafeTransit[] {
  if (!Array.isArray(raw)) return []
  const safe: SafeTransit[] = []
  for (const item of raw.slice(0, 8)) {
    if (!item || typeof item !== 'object') continue
    const t = item as Record<string, unknown>
    const transitingPlanet = String(t.transitingPlanet ?? '')
    const natalPoint = String(t.natalPoint ?? '')
    const aspect = String(t.aspect ?? '')
    const nature = String(t.nature ?? '')
    const orb = Number(t.orb)
    if (!POINTS.includes(transitingPlanet)) continue
    if (!POINTS.includes(natalPoint)) continue
    if (!ASPECTS.includes(aspect)) continue
    if (!NATURES.includes(nature)) continue
    if (!Number.isFinite(orb) || orb < 0 || orb > 15) continue
    safe.push({ transitingPlanet, natalPoint, aspect, nature, orb: Math.round(orb * 10) / 10 })
  }
  return safe
}

function renderChart(chart: NatalChartLike): string {
  const lines: string[] = []

  for (const p of chart.points ?? []) {
    if (!POINTS.includes(p.name) || !SIGNS.includes(p.sign)) continue
    const deg = Number.isFinite(p.degreeInSign) ? Math.floor(p.degreeInSign) : 0
    const house = Number.isFinite(p.house) ? p.house : '?'
    lines.push(`- ${p.name}: ${p.sign} ${deg}° (house ${house})${p.retrograde ? ', retrograde' : ''}`)
  }

  if (chart.ascendant?.sign && SIGNS.includes(chart.ascendant.sign)) {
    lines.push(`- Ascendant (Rising): ${chart.ascendant.sign} ${Math.floor(chart.ascendant.degreeInSign ?? 0)}°`)
  }
  if (chart.midheaven?.sign && SIGNS.includes(chart.midheaven.sign)) {
    lines.push(`- Midheaven: ${chart.midheaven.sign} ${Math.floor(chart.midheaven.degreeInSign ?? 0)}°`)
  }

  return lines.join('\n')
}

function renderTransits(transits: SafeTransit[]): string {
  if (transits.length === 0) return 'None tight enough to report today.'
  return transits
    .map((t) => `- Transiting ${t.transitingPlanet} ${t.aspect} natal ${t.natalPoint} (${t.nature}, orb ${t.orb}°)`)
    .join('\n')
}

export function buildSystemPrompt(chart: NatalChartLike, transits: SafeTransit[]): string {
  // Only the birth date and place label are included -- enough for age-based
  // questions like a Saturn return, without shipping exact coordinates.
  const born = chart.input?.date ? `Born ${chart.input.date}` : 'Birth date not recorded'
  const place = chart.input?.placeLabel ? ` in ${chart.input.placeLabel}` : ''

  return `You are the LunaAura companion: a warm, knowledgeable study-partner who helps someone read their own birth chart. You are not a fortune teller and not a spiritual authority.

THEIR CHART (${born}${place})
Houses use the whole-sign system.
${renderChart(chart)}

TODAY'S TRANSITS TO THEIR CHART
${renderTransits(transits)}

HOW YOU ANSWER
- Ground every astrological claim in a placement listed above, and name it. If it is not listed, you do not know it.
- Astrology here is a lens for self-reflection, not a force that causes events. Say "this placement is often read as", not "you are".
- Prefer opening a question they can sit with over handing down a verdict.
- Keep it under 160 words unless they ask you to go deeper. Plain prose, no markdown, no headers, no emoji.
- Their chart is a starting point for noticing patterns, never a script they are stuck with. Say so when it matters.
- If the question is not something a chart can speak to, say that plainly instead of inventing an astrological angle.

WHAT YOU NEVER DO
- Never name, suggest or interpret a medical or mental-health condition, and never read symptoms. You are not a clinician.
- Never tell them whether to leave a relationship or job, or to start or stop any treatment or medication. Reflect what they are weighing and leave the decision with them.
- Never invent placements, degrees, aspects or transits that are not listed above.
- Never predict specific events or claim certainty about the future.

IF THEY ARE STRUGGLING
If they describe being in crisis, unsafe, or thinking about harming themselves, set the astrology aside completely. Acknowledge what they said plainly and warmly, and encourage them to reach out to someone who can actually help — a person they trust, their doctor, or a crisis line where they live. Do not interpret their chart for it.`
}
