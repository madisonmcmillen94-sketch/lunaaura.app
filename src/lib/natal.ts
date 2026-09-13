import * as Astronomy from 'astronomy-engine'
import { ZODIAC_SIGNS, signFromLongitude, degreeInSign, normalizeDegrees } from './zodiac'

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

export interface BirthInput {
  date: string // YYYY-MM-DD, as entered by the user
  time: string // HH:MM, 24-hour, local time at the birth place
  utcOffsetMinutes: number // minutes to ADD to local time to get UTC (e.g. EDT = 240)
  latitude: number // decimal degrees, north positive
  longitude: number // decimal degrees, east positive
  placeLabel: string // free-text label for display only, e.g. "Chiefland, FL"
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
  points: ChartPoint[] // Sun, Moon, Mercury..Pluto, in that order
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

/** Converts a birth date/time/offset into the corresponding UTC instant. */
export function birthInputToUtcDate(input: BirthInput): Date {
  const [y, m, d] = input.date.split('-').map(Number)
  const [hh, mm] = input.time.split(':').map(Number)
  const localAsUtcMillis = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
  return new Date(localAsUtcMillis + input.utcOffsetMinutes * 60000)
}

/** True ecliptic-of-date longitude of a body, geocentric, apparent (aberration-corrected). */
export function eclipticLongitudeOf(body: Astronomy.Body, date: Date): number {
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

/** Midheaven: the ecliptic longitude with right ascension equal to the local sidereal time. */
function calcMidheaven(date: Date, longitudeDeg: number): number {
  const theta = localSiderealTimeDeg(date, longitudeDeg) * DEG2RAD
  const eps = trueObliquityDeg(date) * DEG2RAD
  const mc = Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * RAD2DEG
  return normalizeDegrees(mc)
}

/** Ascendant: the ecliptic longitude rising on the eastern horizon (Duffett-Smith's formula). */
function calcAscendant(date: Date, latitudeDeg: number, longitudeDeg: number): number {
  const theta = localSiderealTimeDeg(date, longitudeDeg) * DEG2RAD
  const eps = trueObliquityDeg(date) * DEG2RAD
  const phi = latitudeDeg * DEG2RAD
  const y = -Math.cos(theta)
  const x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(theta)
  const asc = Math.atan2(y, x) * RAD2DEG
  return normalizeDegrees(asc)
}

/** Whole-sign house: the sign containing the Ascendant is House 1 in its entirety. */
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

export { ZODIAC_SIGNS }

