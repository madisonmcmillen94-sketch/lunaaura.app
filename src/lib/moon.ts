import * as Astronomy from 'astronomy-engine'

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent'

export interface MoonInfo {
  phaseAngle: number // 0-360, 0 = new, 180 = full
  illumination: number // 0-1
  phaseName: MoonPhaseName
  daysUntilFullOrNew: { type: 'Full Moon' | 'New Moon'; days: number }
}

export function phaseNameFromAngle(angle: number): MoonPhaseName {
  const a = ((angle % 360) + 360) % 360
  if (a < 22.5) return 'New Moon'
  if (a < 67.5) return 'Waxing Crescent'
  if (a < 112.5) return 'First Quarter'
  if (a < 157.5) return 'Waxing Gibbous'
  if (a < 202.5) return 'Full Moon'
  if (a < 247.5) return 'Waning Gibbous'
  if (a < 292.5) return 'Last Quarter'
  if (a < 337.5) return 'Waning Crescent'
  return 'New Moon'
}

export function getMoonInfo(date: Date = new Date()): MoonInfo {
  const angle = Astronomy.MoonPhase(date)
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date)

  // Search forward for the next full moon and next new moon to report proximity.
  const nextFull = Astronomy.SearchMoonPhase(180, date, 40)
  const nextNew = Astronomy.SearchMoonPhase(0, date, 40)

  let closest: { type: 'Full Moon' | 'New Moon'; days: number }
  const fullDays = nextFull ? (nextFull.date.getTime() - date.getTime()) / 86400000 : Infinity
  const newDays = nextNew ? (nextNew.date.getTime() - date.getTime()) / 86400000 : Infinity
  closest = fullDays <= newDays
    ? { type: 'Full Moon', days: Math.round(fullDays) }
    : { type: 'New Moon', days: Math.round(newDays) }

  return {
    phaseAngle: angle,
    illumination: illum.phase_fraction,
    phaseName: phaseNameFromAngle(angle),
    daysUntilFullOrNew: closest,
  }
}

export function getMoonSign(date: Date = new Date()): string {
  // Ecliptic longitude of the Moon -> zodiac sign (tropical, geocentric).
  const eq = Astronomy.Equator(Astronomy.Body.Moon, date, new Astronomy.Observer(0, 0, 0), true, true)
  const ecl = Astronomy.Ecliptic(eq.vec)
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]
  const lon = ((ecl.elon % 360) + 360) % 360
  return signs[Math.floor(lon / 30)]
}
