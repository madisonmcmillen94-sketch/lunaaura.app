// Shared zodiac constants used by the moon, natal chart, and transit modules.
// Tropical zodiac (season-based), the standard for Western astrology -- distinct
// from the sidereal zodiac used in Vedic/Jyotish traditions.

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number]

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water'
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable'

const ELEMENTS: Record<ZodiacSign, Element> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
}

const MODALITIES: Record<ZodiacSign, Modality> = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
}

/** Normalizes any angle to the [0, 360) range. */
export function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function signFromLongitude(longitude: number): ZodiacSign {
  const lon = normalizeDegrees(longitude)
  return ZODIAC_SIGNS[Math.floor(lon / 30)]
}

export function degreeInSign(longitude: number): number {
  return normalizeDegrees(longitude) % 30
}

export function elementOf(sign: ZodiacSign): Element {
  return ELEMENTS[sign]
}

export function modalityOf(sign: ZodiacSign): Modality {
  return MODALITIES[sign]
}

/** Shortest signed angular distance from a to b, in degrees, range (-180, 180]. */
export function angleDiff(a: number, b: number): number {
  let d = normalizeDegrees(b - a)
  if (d > 180) d -= 360
  return d
}

export function formatDegree(longitude: number): string {
  const d = degreeInSign(longitude)
  const whole = Math.floor(d)
  const minutes = Math.round((d - whole) * 60)
  return minutes === 60 ? `${whole + 1}°0'` : `${whole}°${minutes}'`
}

