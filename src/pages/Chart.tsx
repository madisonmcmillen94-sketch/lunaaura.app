import { useEffect, useMemo, useState } from 'react'
import type { BirthInput, NatalChart } from '../lib/natal'
import { loadNatalChart, saveBirthInput, clearNatalChart } from '../lib/natalStorage'
import { findTransits, type TransitHit } from '../lib/transits'
import { getSomaticGuidance } from '../lib/somatic'
import { formatDegree } from '../lib/zodiac'
import PlaceSearch from '../components/PlaceSearch'

const UTC_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12).map((h) => ({
  value: h * 60,
  label: h === 0 ? 'UTC+0' : `UTC${h > 0 ? '+' : ''}${h}`,
}))

const COMMON_OFFSET_HINTS = 'Examples: Eastern Time is UTC-5 (standard) or UTC-4 (daylight, roughly mid-March–early November). Pacific Time is UTC-8 / UTC-7.'

function emptyInput(): BirthInput {
  return { date: '', time: '', utcOffsetMinutes: 240, latitude: NaN, longitude: NaN, placeLabel: '' }
}

/** Picks the most relevant transits for the day: tightest orb, one per planet. */
function pickTopTransits(hits: TransitHit[], max = 5): TransitHit[] {
  const seenPlanets = new Set<string>()
  const picked: TransitHit[] = []
  for (const hit of hits) {
    if (seenPlanets.has(hit.transitingPlanet)) continue
    seenPlanets.add(hit.transitingPlanet)
    picked.push(hit)
    if (picked.length >= max) break
  }
  return picked
}

export default function Chart() {
  const [chart, setChart] = useState<NatalChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<BirthInput>(emptyInput())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNatalChart()
      .then((c) => {
        setChart(c)
        if (!c) setEditing(true)
      })
      .catch((e) => {
        console.error(e)
        setError('Could not load your chart right now — try refreshing in a moment.')
      })
      .finally(() => setLoading(false))
  }, [])

  const today = useMemo(() => new Date(), [])
  const transits = useMemo(() => (chart ? pickTopTransits(findTransits(chart, today)) : []), [chart, today])

  async function handleSave() {
    setError(null)
    if (!form.date || !form.time || Number.isNaN(form.latitude) || Number.isNaN(form.longitude)) {
      setError('Date, time, latitude, and longitude are all needed for an accurate chart.')
      return
    }
    setSaving(true)
    try {
      const saved = await saveBirthInput(form)
      setChart(saved)
      setEditing(false)
    } catch (e) {
      console.error(e)
      setError('Couldn’t save your chart — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    try {
      await clearNatalChart()
      setChart(null)
      setForm(emptyInput())
      setEditing(true)
    } catch (e) {
      console.error(e)
      setError('Couldn’t reset your chart — try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="text-sm text-[#9a92b3]">Loading your chart…</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Your Chart</h1>
      <p className="text-[#c9c2dd] mb-8">
        A birth chart is a map of where the Sun, Moon, and planets were the moment you were
        born — a lens for noticing patterns in yourself, not a fixed script. Paired with today's
        sky, it points to what might already be moving in your nervous system.
      </p>

      {error && (
        <p className="mb-4 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {editing ? (
        <div className="glow-card rounded-2xl p-6 mb-10 space-y-4">
          <h2 className="text-lg font-display">Enter your birth details</h2>
          <p className="text-xs text-[#8e85a8]">
            This stays private to your own account. Exact birth time matters — it changes your
            Rising sign and house placements. If you don't know it, use your best estimate; the
            Sun, Moon, and planet signs will still be accurate.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Birth date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Birth time (local, 24h)</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#b6acd1] mb-2">UTC offset at time of birth</label>
            <select
              value={form.utcOffsetMinutes}
              onChange={(e) => setForm((f) => ({ ...f, utcOffsetMinutes: Number(e.target.value) }))}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
            >
              {UTC_OFFSETS.map((o) => (
                <option key={o.value} value={-o.value} className="bg-[#1a0f2e]">
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#8e85a8] mt-1">{COMMON_OFFSET_HINTS}</p>
          </div>

          <PlaceSearch
            onPick={(place) =>
              setForm((f) => ({
                ...f,
                placeLabel: place.label,
                latitude: place.latitude,
                longitude: place.longitude,
              }))
            }
          />

          {form.placeLabel && Number.isFinite(form.latitude) && (
            <p className="text-xs text-[#a9e6c8]">✓ Using {form.placeLabel}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Latitude (decimal, north positive)</label>
              <input
                type="number"
                step="0.0001"
                value={Number.isNaN(form.latitude) ? '' : form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) }))}
                placeholder="e.g. 29.4841"
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Longitude (decimal, east positive)</label>
              <input
                type="number"
                step="0.0001"
                value={Number.isNaN(form.longitude) ? '' : form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) }))}
                placeholder="e.g. -82.8593 (west is negative)"
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
          </div>
          <p className="text-xs text-[#8e85a8]">
            These fill in automatically when you pick a place above — you only need to touch them
            to fine-tune the exact spot.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
            >
              {saving ? 'Calculating…' : 'Calculate my chart'}
            </button>
            {chart && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-full border border-white/15 text-[#c9c2dd] px-6 py-2.5 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : chart ? (
        <>
          <section className="glow-card rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-lg font-display">Your placements</h2>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => setEditing(true)} className="text-xs text-[#c9c2dd] hover:text-[#e9e4f5] underline decoration-[#caa6ff]/40">
                  Edit
                </button>
                <button onClick={handleReset} className="text-xs text-[#8e85a8] hover:text-[#e9e4f5]">
                  Reset
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Sun</p>
                <p className="text-lg text-[#e9d9ff]">{chart.points[0].sign}</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Moon</p>
                <p className="text-lg text-[#e9d9ff]">{chart.points[1].sign}</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Rising</p>
                <p className="text-lg text-[#e9d9ff]">{chart.ascendant.sign}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#8e85a8] border-b border-white/10">
                    <th className="py-2 pr-4 font-normal">Point</th>
                    <th className="py-2 pr-4 font-normal">Sign</th>
                    <th className="py-2 pr-4 font-normal">Degree</th>
                    <th className="py-2 font-normal">House</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.points.map((p) => (
                    <tr key={p.name} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-4 text-[#dcd6ec]">{p.name}</td>
                      <td className="py-2 pr-4 text-[#dcd6ec]">
                        {p.sign}
                        {p.retrograde && <span className="text-[#b6acd1]"> ℞</span>}
                      </td>
                      <td className="py-2 pr-4 text-[#b6acd1]">{formatDegree(p.longitude)}</td>
                      <td className="py-2 text-[#b6acd1]">House {p.house}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 pr-4 text-[#dcd6ec]">Midheaven</td>
                    <td className="py-2 pr-4 text-[#dcd6ec]">{chart.midheaven.sign}</td>
                    <td className="py-2 pr-4 text-[#b6acd1]">{formatDegree(chart.midheaven.longitude)}</td>
                    <td className="py-2 text-[#b6acd1]">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#8e85a8] mt-3">
              Houses use the whole-sign system (the simplest, most transparent method). ℞ marks a
              planet retrograde at your birth moment.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-display mb-1">Today, for you</h2>
            <p className="text-sm text-[#8e85a8] mb-4">
              Where today's sky is touching your chart, and a body-based way to work with it.
              This is a lens for noticing what's already there — not a diagnosis, and not a
              reason to override what actually works for you.
            </p>
            {transits.length === 0 ? (
              <div className="glow-card rounded-2xl p-6">
                <p className="text-sm text-[#dcd6ec]">
                  Nothing in today's sky is closely activating your chart — a comparatively quiet
                  day, placement-wise.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transits.map((hit, i) => {
                  const guidance = getSomaticGuidance(hit)
                  return (
                    <div key={i} className="glow-card rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">
                        Transiting {hit.transitingPlanet} {hit.aspect.toLowerCase()} your natal {hit.natalPoint}
                        {' · '}in your house {hit.house}
                      </p>
                      <p className="text-[#dcd6ec] leading-relaxed mb-3">{guidance.theme}</p>
                      <p className="text-sm text-[#b6acd1]">
                        <span className="font-semibold text-[#e9d9ff]">Try this: </span>
                        {guidance.practice}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <p className="text-xs text-[#8e85a8] text-center leading-relaxed">
            None of this is a diagnosis or a reason to skip care that's working for you. Think of
            it as another language for what your body may already be telling you.
          </p>
        </>
      ) : null}
    </div>
  )
}

