/**
 * Works out the UTC offset that applied at someone's birth, from their birth
 * coordinates and the date/time they were born.
 *
 * Why this exists: asking people for a "UTC offset at time of birth" asks them
 * to know whether daylight saving was in force in their country on that exact
 * date -- rules that have changed repeatedly (the US ran year-round DST in
 * 1974, for one). A wrong offset shifts the whole chart: the Ascendant and
 * every house boundary move, while the page still looks perfectly fine. So the
 * chart is silently wrong rather than visibly broken, which is the worst kind.
 *
 * Coordinates give us an IANA zone; the browser's own timezone database then
 * gives the historically correct offset for that zone on that date.
 */

type TzLookupFn = (latitude: number, longitude: number) => string

let cachedLookup: TzLookupFn | null = null

/**
 * The coordinate->zone table is ~70KB, and only matters once someone is
 * actually entering birth details, so it is loaded on demand rather than
 * shipped in the initial bundle.
 */
async function loadLookup(): Promise<TzLookupFn> {
  if (cachedLookup) return cachedLookup
  // tz-lookup is CommonJS, so depending on how the bundler interops it the
  // function may arrive either as the module itself or under `.default`.
  const mod: unknown = await import('tz-lookup')
  const resolved = typeof mod === 'function' ? mod : (mod as { default?: unknown }).default
  if (typeof resolved !== 'function') throw new Error('tz-lookup did not export a function')
  cachedLookup = resolved as TzLookupFn
  return cachedLookup
}

/** IANA zone name for a coordinate, or null if it can't be determined. */
export async function resolveTimeZone(latitude: number, longitude: number): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  try {
    const lookup = await loadLookup()
    return lookup(latitude, longitude)
  } catch (err) {
    console.error('Timezone lookup failed', err)
    return null
  }
}

/** Minutes EAST of UTC that `timeZone` sat at a given absolute instant. */
function zoneOffsetEastAt(timeZone: string, instant: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parts: Record<string, string> = {}
  for (const part of dtf.formatToParts(instant)) parts[part.type] = part.value

  // Some ICU builds render midnight as hour "24".
  const hour = parts.hour === '24' ? 0 : Number(parts.hour)
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second)
  )
  return Math.round((asUtc - instant.getTime()) / 60000)
}

/**
 * Wall-clock birth time in a zone -> minutes to ADD to local time to get UTC,
 * which is the convention BirthInput.utcOffsetMinutes uses (EDT = 240).
 */
export function utcOffsetMinutesFor(timeZone: string, isoDate: string, isoTime: string): number | null {
  if (!timeZone || !isoDate) return null

  const [year, month, day] = isoDate.split('-').map(Number)
  const [hour, minute] = (isoTime || '12:00').split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null

  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute)

  // The offset depends on the instant, but all we have is wall-clock time.
  // Guess that the wall clock is UTC, then correct repeatedly -- this settles
  // in one or two rounds everywhere except inside a DST gap, where no answer
  // is truly correct.
  let instant = new Date(wallAsUtc)
  for (let i = 0; i < 3; i += 1) {
    const east = zoneOffsetEastAt(timeZone, instant)
    instant = new Date(wallAsUtc - east * 60000)
  }

  return -zoneOffsetEastAt(timeZone, instant)
}

/** 240 -> "UTC-4", -330 -> "UTC+5:30" */
export function describeOffset(utcOffsetMinutes: number): string {
  const east = -utcOffsetMinutes
  const sign = east < 0 ? '-' : '+'
  const abs = Math.abs(east)
  const hours = Math.floor(abs / 60)
  const mins = abs % 60
  return `UTC${sign}${hours}${mins ? `:${String(mins).padStart(2, '0')}` : ''}`
}
