import * as Astronomy from 'astronomy-engine'

export interface PlanetStatus {
  name: string
  body: Astronomy.Body
  retrograde: boolean
  eclipticLongitude: number
}

const TRACKED: { name: string; body: Astronomy.Body }[] = [
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto },
]

function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  const eq = Astronomy.Equator(body, date, new Astronomy.Observer(0, 0, 0), true, true)
  const ecl = Astronomy.Ecliptic(eq.vec)
  return ((ecl.elon % 360) + 360) % 360
}

export function getPlanetStatuses(date: Date = new Date()): PlanetStatus[] {
  const before = new Date(date.getTime() - 2 * 86400000)
  const after = new Date(date.getTime() + 2 * 86400000)

  return TRACKED.map(({ name, body }) => {
    const lonBefore = eclipticLongitude(body, before)
    const lonAfter = eclipticLongitude(body, after)
    // Handle wraparound at 0/360 when checking direction of motion.
    let delta = lonAfter - lonBefore
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    return {
      name,
      body,
      retrograde: delta < 0,
      eclipticLongitude: eclipticLongitude(body, date),
    }
  })
}

export function getRetrogradePlanets(date: Date = new Date()): string[] {
  return getPlanetStatuses(date)
    .filter((p) => p.retrograde)
    .map((p) => p.name)
}
