// Server-side copy of the natal chart math used by the admin "force fix"
// endpoint. Kept in sync with src/lib/natal.ts (same formulas, same fix for
// the Ascendant sign error). Duplicated rather than imported so the admin
// API has no dependency on the client bundle.
import * as Astronomy from 'astronomy-engine'

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

export interface BirthInput {
  date: string
  time: string
  utcOffsetMinutes: number
  latitude: number
  longitude: number
  placeLabel: string
}

export interface ChartPoint {
  name: string
  longitude: number
  sign: string
  degreeInSign: number
  house: number
  retrograde: boolean
}

export interface NatalChart {
  input: BirthInput
  utcIso: string
  ascendant: { longitude: number; sign: string; degreeInSign: number }
  midheaven: { longitude: number; sign: string; degreeInSign: number }
  points: ChartPoint[]
  houseSystem: 'whole-sign'
}

const BODIES: { name: string; body: Astronomy.Body }[] = [
  { name: 'Sun', body: Astronomy.Body.Sun },
  { name: 'Moon', body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto },
]

function normalizeDegrees(deg: number): number {
  return ((deg % 360) + 360) % 360
}
function signFromLongitude(longitude: number): string {
  return ZODIAC_SIGNS[Math.floor(normalizeDegrees(longitude) / 30)]
}
function degreeInSign(longitude: number): number {
  return normalizeDegrees(longitude) % 30
}

export function birthInputToUtcDate(input: BirthInput): Date {
  const [y, m, d] = input.date.split('-').map(Number)
  const [hh, mm] = input.time.split(':').map(Number)
  const localAsUtcMillis = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
  return new Date(localAsUtcMillis + input.utcOffsetMinutes * 60000)
}

function eclipticLongitudeOf(body: Astronomy.Body, date: Date): number {
  const geoVector = Astronomy.GeoVector(body, date, true)
  const ecl = Astronomy.Ecliptic(geoVector)
  return normalizeDegrees(ecl.elon)
}

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  const before = eclipticLongitudeOf(body, new Date(date.getTime() - 2 * 86400000))
  const after = eclipticLongitudeOf(body, new Date(date.getTime() + 2 * 86400000))
  let delta = after - before
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta < 0
}

function localSiderealTimeDeg(date: Date, longitudeDeg: number): number {
  const gstHours = Astronomy.SiderealTime(date)
  return normalizeDegrees(gstHours * 15 + longitudeDeg)
}
function trueObliquityDeg(date: Date): number {
  return Astronomy.e_tilt(Astronomy.MakeTime(date)).tobl
}
function calcMidheaven(date: Date, longitudeDeg: number): number {
  const theta = localSiderealTimeDeg(date, longitudeDeg) * DEG2RAD
  const eps = trueObliquityDeg(date) * DEG2RAD
  const mc = Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * RAD2DEG
  return normalizeDegrees(mc)
}

// Fixed: this used to return the Descendant (180 deg off). y/x are now the
// correct sign so atan2 lands on the eastern-horizon point.
function calcAscendant(date: Date, latitudeDeg: number, longitudeDeg: number): number {
  const theta = localSiderealTimeDeg(date, longitudeDeg) * DEG2RAD
  const eps = trueObliquityDeg(date) * DEG2RAD
  const phi = latitudeDeg * DEG2RAD
  const y = Math.cos(theta)
  const x = -(Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta))
  const asc = Math.atan2(y, x) * RAD2DEG
  return normalizeDegrees(asc)
}

function wholeSignHouse(pointLongitude: number, ascendantLongitude: number): number {
  const ascSignIndex = Math.floor(normalizeDegrees(ascendantLongitude) / 30)
  const pointSignIndex = Math.floor(normalizeDegrees(pointLongitude) / 30)
  return ((pointSignIndex - ascSignIndex + 12) % 12) + 1
}

export function computeNatalChart(input: BirthInput): NatalChart {
  const utcDate = birthInputToUtcDate(input)
  const ascLon = calcAscendant(utcDate, input.latitude, input.longitude)
  const mcLon = calcMidheaven(utcDate, input.longitude)

  const points: ChartPoint[] = BODIES.map(({ name, body }) => {
    const lon = eclipticLongitudeOf(body, utcDate)
    return {
      name,
      longitude: lon,
      sign: signFromLongitude(lon),
      degreeInSign: degreeInSign(lon),
      house: wholeSignHouse(lon, ascLon),
      retrograde: name === 'Sun' || name === 'Moon' ? false : isRetrograde(body, utcDate),
    }
  })

  return {
    input,
    utcIso: utcDate.toISOString(),
    ascendant: {
      longitude: ascLon,
      sign: signFromLongitude(ascLon),
      degreeInSign: degreeInSign(ascLon),
    },
    midheaven: {
      longitude: mcLon,
      sign: signFromLongitude(mcLon),
      degreeInSign: degreeInSign(mcLon),
    },
    points,
    houseSystem: 'whole-sign',
  }
}
