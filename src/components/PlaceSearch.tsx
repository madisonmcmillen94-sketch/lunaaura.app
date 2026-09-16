import { useState } from 'react'

/**
 * Birth-place lookup.
 *
 * Asking someone to open Google Maps, right-click a pin and copy two decimal
 * numbers back into a signup form is the single biggest drop-off point in the
 * flow, so this resolves a place name to coordinates in-app instead. The raw
 * latitude/longitude fields stay available underneath for anyone who already
 * knows them or needs to correct a match.
 *
 * Geocoding is OpenStreetMap's Nominatim: free, no API key, CORS-enabled.
 * Their usage policy caps automated use at roughly one request a second, so
 * this searches on submit rather than on every keystroke.
 */

export interface PlaceMatch {
  label: string
  latitude: number
  longitude: number
}

interface NominatimResult {
  display_name?: string
  lat?: string
  lon?: string
}

export default function PlaceSearch({ onPick }: { onPick: (place: PlaceMatch) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceMatch[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setError(null)
    setResults(null)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as NominatimResult[]

      const matches: PlaceMatch[] = []
      for (const r of data) {
        const lat = Number(r.lat)
        const lon = Number(r.lon)
        if (r.display_name && Number.isFinite(lat) && Number.isFinite(lon)) {
          matches.push({ label: r.display_name, latitude: lat, longitude: lon })
        }
      }

      if (matches.length === 0) {
        setError('No match for that place — try just the city and country, or enter coordinates below.')
      }
      setResults(matches)
    } catch (err) {
      console.error('Place lookup failed', err)
      setError('Place lookup is unavailable right now — you can enter coordinates below instead.')
    } finally {
      setSearching(false)
    }
  }

  /**
   * "Chiefland, Levy County, Florida, 32626, United States"
   *   -> "Chiefland, Florida, United States"
   *
   * Nominatim's display_name varies in depth (some places carry a postcode or
   * county, some don't), so drop the administrative noise rather than slicing
   * at fixed positions — which silently keeps "Levy County" and throws away
   * "Florida" on the shorter shape.
   */
  function tidy(label: string): string {
    const noise = /\b(county|parish|borough|district|municipality|prefecture)\b/i
    const parts = label
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && !noise.test(p) && !/^[\d\s-]+$/.test(p))

    if (parts.length <= 3) return parts.join(', ')
    return [parts[0], parts[parts.length - 2], parts[parts.length - 1]].join(', ')
  }

  return (
    <div>
      <label className="block text-sm text-[#b6acd1] mb-2" htmlFor="birth-place-search">
        Birth place
      </label>
      <div className="flex gap-2">
        <input
          id="birth-place-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void search()
            }
          }}
          placeholder="e.g. Chiefland, Florida"
          className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching || !query.trim()}
          className="rounded-full border border-[#caa6ff]/50 text-[#e9d9ff] px-4 py-2 text-sm hover:bg-[#caa6ff]/10 transition-colors disabled:opacity-40 shrink-0"
        >
          {searching ? 'Searching…' : 'Find'}
        </button>
      </div>

      {error && <p className="text-xs text-[#ffb4b4] mt-2 leading-relaxed">{error}</p>}

      {results && results.length > 0 && (
        <ul className="mt-2 space-y-1">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  onPick({ ...r, label: tidy(r.label) })
                  setResults(null)
                  setQuery(tidy(r.label))
                }}
                className="w-full text-left text-sm rounded-lg border border-white/10 px-3 py-2 text-[#c9c2dd] hover:bg-white/5 hover:border-[#caa6ff]/40 transition-colors"
              >
                {tidy(r.label)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-[#8e85a8] mt-2">Place data from OpenStreetMap.</p>
    </div>
  )
}
