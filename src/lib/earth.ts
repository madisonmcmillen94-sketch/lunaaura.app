// Real, public, no-auth data sources:
// - USGS Earthquake feed: significant global seismic activity, last day.
// - NOAA SWPC: planetary K-index, a real measure of geomagnetic storm activity.
// Both are genuine geophysical data. We are explicit in the UI that any link
// between these events and an individual nervous system is an intuitive/
// experiential framing, not a clinical claim.

export interface QuakeSummary {
  count24h: number
  maxMagnitude: number | null
  strongestPlace: string | null
  fetchedAt: string
}

export interface GeomagneticSummary {
  kIndex: number | null
  status: 'quiet' | 'unsettled' | 'active' | 'storm' | 'unknown'
  fetchedAt: string
}

export async function fetchQuakeSummary(): Promise<QuakeSummary> {
  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
    )
    if (!res.ok) throw new Error('quake fetch failed')
    const data = await res.json()
    const features = data.features ?? []
    let maxMagnitude: number | null = null
    let strongestPlace: string | null = null
    for (const f of features) {
      const mag = f.properties?.mag
      if (typeof mag === 'number' && (maxMagnitude === null || mag > maxMagnitude)) {
        maxMagnitude = mag
        strongestPlace = f.properties?.place ?? null
      }
    }
    return {
      count24h: features.length,
      maxMagnitude,
      strongestPlace,
      fetchedAt: new Date().toISOString(),
    }
  } catch {
    return { count24h: 0, maxMagnitude: null, strongestPlace: null, fetchedAt: new Date().toISOString() }
  }
}

export async function fetchGeomagneticSummary(): Promise<GeomagneticSummary> {
  try {
    const res = await fetch(
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'
    )
    if (!res.ok) throw new Error('k-index fetch failed')
    const rows: string[][] = await res.json()
    // First row is header; last row is most recent reading.
    const last = rows[rows.length - 1]
    const kIndex = last ? parseFloat(last[1]) : null
    let status: GeomagneticSummary['status'] = 'unknown'
    if (kIndex !== null && !Number.isNaN(kIndex)) {
      if (kIndex < 3) status = 'quiet'
      else if (kIndex < 4) status = 'unsettled'
      else if (kIndex < 5) status = 'active'
      else status = 'storm'
    }
    return { kIndex: kIndex ?? null, status, fetchedAt: new Date().toISOString() }
  } catch {
    return { kIndex: null, status: 'unknown', fetchedAt: new Date().toISOString() }
  }
}
