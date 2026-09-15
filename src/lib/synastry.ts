import type { NatalChart } from './natal'
import { angleDiff } from './zodiac'
import type { AspectName, AspectNature } from './transits'

// Cross-chart ("synastry") aspects between two people's natal charts. Reuses
// the same aspect/orb model as transits.ts (duplicated here rather than
// imported, matching how natal.ts's math is already duplicated server-side
// in api/lib/natalCalc.ts -- these small astro tables are cheap to keep in
// sync and this avoids coupling synastry to the transit module's shape).
const ASPECTS: { name: AspectName; angle: number; orb: number; nature: AspectNature }[] = [
  { name: 'Conjunction', angle: 0, orb: 6, nature: 'intensifying' },
  { name: 'Sextile', angle: 60, orb: 4, nature: 'harmonious' },
  { name: 'Square', angle: 90, orb: 5, nature: 'challenging' },
  { name: 'Trine', angle: 120, orb: 5, nature: 'harmonious' },
  { name: 'Opposition', angle: 180, orb: 6, nature: 'challenging' },
]

// The point set kept deliberately small (the "personal" planets + Ascendant)
// rather than all 10 planets -- a full 12x12 cross-chart grid is mostly noise
// for a wellness read; these are the placements synastry conventionally
// leans on for how two people actually feel around each other day to day.
const SYNASTRY_POINTS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant'] as const
type SynastryPoint = (typeof SYNASTRY_POINTS)[number]

// Short, direction-agnostic theme for each unordered pair of points -- looked
// up by sorting the two point names alphabetically, so "Sun asks Moon" and
// "Moon asks Sun" share one blurb (the specific direction is still named in
// the sentence built around it).
const PAIR_THEMES: Record<string, string> = {
  'Ascendant-Ascendant': 'how your outward styles land on each other',
  'Ascendant-Mars': 'how much heat or urgency you stir up in each other',
  'Ascendant-Mercury': 'how naturally you fall into conversation',
  'Ascendant-Moon': 'how at-home you feel in each other’s presence',
  'Ascendant-Sun': 'the first impression you make on each other',
  'Ascendant-Venus': 'attraction, at first meeting and beyond',
  'Mars-Mars': 'shared drive — or competing for the same lane',
  'Mars-Mercury': 'banter, debate, and how you push each other’s thinking',
  'Mars-Moon': 'how you handle friction and desire together',
  'Mars-Sun': 'a spark of motivation between you',
  'Mars-Venus': 'romantic and creative chemistry',
  'Mercury-Mercury': 'how naturally your minds click',
  'Mercury-Moon': 'how easily you talk about feelings',
  'Mercury-Sun': 'how you talk to, and understand, each other',
  'Mercury-Venus': 'flirtation and easy conversation',
  'Moon-Moon': 'emotional rhythm, and how safe you feel together',
  'Moon-Sun': 'one of you shining a light the other already recognizes in themselves',
  'Moon-Venus': 'emotional warmth and affection',
  'Sun-Sun': 'a sense of shared identity and direction',
  'Sun-Venus': 'warmth and appreciation flowing easily between you',
  'Venus-Venus': 'shared taste and values around love',
}

function pairTheme(a: string, b: string): string {
  const key = [a, b].sort().join('-')
  return PAIR_THEMES[key] ?? 'a point of connection worth noticing between you'
}

export interface SynastryHit {
  personAPoint: SynastryPoint
  personBPoint: SynastryPoint
  aspect: AspectName
  nature: AspectNature
  orb: number
  theme: string
}

/** Pulls just the points synastry cares about out of a full natal chart, by name. */
function pointLongitudes(chart: NatalChart): Record<SynastryPoint, number> {
  const byName = new Map(chart.points.map((p) => [p.name, p.longitude]))
  return {
    Sun: byName.get('Sun') ?? 0,
    Moon: byName.get('Moon') ?? 0,
    Mercury: byName.get('Mercury') ?? 0,
    Venus: byName.get('Venus') ?? 0,
    Mars: byName.get('Mars') ?? 0,
    Ascendant: chart.ascendant.longitude,
  }
}

/**
 * Every aspect formed between person A's personal planets/Ascendant and
 * person B's, sorted tightest orb first. Pure function over two already-
 * computed charts -- no astronomy re-run, no network, no persistence.
 */
export function findSynastryAspects(chartA: NatalChart, chartB: NatalChart): SynastryHit[] {
  const a = pointLongitudes(chartA)
  const b = pointLongitudes(chartB)
  const hits: SynastryHit[] = []

  for (const pointA of SYNASTRY_POINTS) {
    for (const pointB of SYNASTRY_POINTS) {
      const diff = Math.abs(angleDiff(a[pointA], b[pointB]))
      for (const aspect of ASPECTS) {
        const orb = Math.abs(diff - aspect.angle)
        if (orb <= aspect.orb) {
          hits.push({
            personAPoint: pointA,
            personBPoint: pointB,
            aspect: aspect.name,
            nature: aspect.nature,
            orb,
            theme: pairTheme(pointA, pointB),
          })
        }
      }
    }
  }

  return hits.sort((x, y) => x.orb - y.orb)
}

export interface SynastrySnapshot {
  total: number
  harmonious: number
  challenging: number
  intensifying: number
}

/** Quick counts across all found aspects, for a headline "snapshot" line. */
export function synastrySnapshot(hits: SynastryHit[]): SynastrySnapshot {
  return {
    total: hits.length,
    harmonious: hits.filter((h) => h.nature === 'harmonious').length,
    challenging: hits.filter((h) => h.nature === 'challenging').length,
    intensifying: hits.filter((h) => h.nature === 'intensifying').length,
  }
}
