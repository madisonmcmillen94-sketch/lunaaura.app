import * as Astronomy from 'astronomy-engine'
import { eclipticLongitudeOf, type NatalChart } from './natal'
import { angleDiff, signFromLongitude } from './zodiac'

export type AspectName = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition'
export type AspectNature = 'intensifying' | 'harmonious' | 'challenging'

const ASPECTS: { name: AspectName; angle: number; orb: number; nature: AspectNature }[] = [
  { name: 'Conjunction', angle: 0, orb: 6, nature: 'intensifying' },
  { name: 'Sextile', angle: 60, orb: 4, nature: 'harmonious' },
  { name: 'Square', angle: 90, orb: 5, nature: 'challenging' },
  { name: 'Trine', angle: 120, orb: 5, nature: 'harmonious' },
  { name: 'Opposition', angle: 180, orb: 6, nature: 'challenging' },
]

const TRANSITING_BODIES: { name: string; body: Astronomy.Body }[] = [
  { name: 'Moon', body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Sun', body: Astronomy.Body.Sun },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto },
]

export interface TransitHit {
  transitingPlanet: string
  transitingLongitude: number
  natalPoint: string // e.g. "Sun", "Moon", "Ascendant", "Midheaven"
  natalLongitude: number
  aspect: AspectName
  nature: AspectNature
  orb: number // absolute degrees from exact, smaller = tighter/more prominent
  house: number // whole-sign house the transiting planet currently occupies
}

/** Whole-sign house of a transiting longitude, given the natal Ascendant. */
function wholeSignHouse(pointLongitude: number, ascendantLongitude: number): number {
  const ascSignIndex = Math.floor(((ascendantLongitude % 360) + 360) % 360 / 30)
  const pointSignIndex = Math.floor(((pointLongitude % 360) + 360) % 360 / 30)
  return ((pointSignIndex - ascSignIndex + 12) % 12) + 1
}

/**
 * Finds all transiting-planet-to-natal-point aspects active on the given date,
 * sorted tightest orb first. Skips Moon-to-Moon (too fast/frequent to be
 * meaningful daily "news") only when explicitly excluded by the caller.
 */
export function findTransits(chart: NatalChart, date: Date = new Date()): TransitHit[] {
  const natalPoints = [
    ...chart.points.map((p) => ({ name: p.name, longitude: p.longitude })),
    { name: 'Ascendant', longitude: chart.ascendant.longitude },
    { name: 'Midheaven', longitude: chart.midheaven.longitude },
  ]

  const hits: TransitHit[] = []

  for (const { name: transitName, body } of TRANSITING_BODIES) {
    const transitLon = eclipticLongitudeOf(body, date)
    const house = wholeSignHouse(transitLon, chart.ascendant.longitude)

    for (const natalPoint of natalPoints) {
      const diff = Math.abs(angleDiff(natalPoint.longitude, transitLon))
      for (const aspect of ASPECTS) {
        const orb = Math.abs(diff - aspect.angle)
        if (orb <= aspect.orb) {
          hits.push({
            transitingPlanet: transitName,
            transitingLongitude: transitLon,
            natalPoint: natalPoint.name,
            natalLongitude: natalPoint.longitude,
            aspect: aspect.name,
            nature: aspect.nature,
            orb,
            house,
          })
        }
      }
    }
  }

  return hits.sort((a, b) => a.orb - b.orb)
}

export function transitingSign(hit: TransitHit): string {
  return signFromLongitude(hit.transitingLongitude)
}

