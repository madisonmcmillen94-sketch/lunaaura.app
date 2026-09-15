import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BirthInput, NatalChart } from '../lib/natal'
import { computeNatalChart } from '../lib/natal'
import { loadNatalChart } from '../lib/natalStorage'
import { findSynastryAspects, synastrySnapshot, type SynastryHit } from '../lib/synastry'
import { formatDegree } from '../lib/zodiac'
import UpgradeGate from '../components/UpgradeGate'

const UTC_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12).map((h) => ({
  value: h * 60,
  label: h === 0 ? 'UTC+0' : `UTC${h > 0 ? '+' : ''}${h}`,
}))

const NATURE_LABEL: Record<string, string> = {
  harmonious: 'harmonious',
  intensifying: 'intensifying',
  challenging: 'challenging',
}

function emptyInput(): BirthInput {
  return { date: '', time: '', utcOffsetMinutes: 240, latitude: NaN, longitude: NaN, placeLabel: '' }
}

function SynastryContent() {
  const [myChart, setMyChart] = useState<NatalChart | null | 'loading'>('loading')
  const [form, setForm] = useState<BirthInput>(emptyInput())
  const [partnerChart, setPartnerChart] = useState<NatalChart | null>(null)
  const [hits, setHits] = useState<SynastryHit[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNatalChart()
      .then(setMyChart)
      .catch((e) => {
        console.error(e)
        setError('Could not load your own chart right now — try refreshing.')
        setMyChart(null)
      })
  }, [])

  function handleCalculate() {
    setError(null)
    if (!myChart || myChart === 'loading') return
    if (!form.date || !form.time || Number.isNaN(form.latitude) || Number.isNaN(form.longitude)) {
      setError('Their date, time, latitude, and longitude are all needed for an accurate read.')
      return
    }
    try {
      const chart = computeNatalChart(form)
      setPartnerChart(chart)
      setHits(findSynastryAspects(myChart, chart))
    } catch (e) {
      console.error(e)
      setError('Couldn’t calculate that chart — double check the birth details and try again.')
    }
  }

  if (myChart === 'loading') {
    return <p className="text-sm text-[#9a92b3]">Loading your chart…</p>
  }

  if (!myChart) {
    return (
      <div className="text-center py-8">
        <p className="text-[#dcd6ec] mb-4">
          Save your own birth chart first — synastry compares their chart against yours.
        </p>
        <Link
          to="/chart"
          className="inline-block rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
        >
          Set up your chart
        </Link>
      </div>
    )
  }

  const snapshot = partnerChart ? synastrySnapshot(hits) : null

  return (
    <div className="space-y-8">
      <div className="glow-card rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-display">Their birth details</h2>
        <p className="text-xs text-[#8e85a8]">
          This is calculated in your browser for this session only — it's never saved to any
          account, ours or theirs. Ask them for their exact birth time for the most accurate read.
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
          <label className="block text-sm text-[#b6acd1] mb-2">UTC offset at time of their birth</label>
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
        </div>

        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">Their name or a label (optional)</label>
          <input
            value={form.placeLabel}
            onChange={(e) => setForm((f) => ({ ...f, placeLabel: e.target.value }))}
            placeholder="e.g. Jordan"
            className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
          />
        </div>

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

        {error && <p className="text-sm text-[#ffb4b4]">{error}</p>}

        <button
          onClick={handleCalculate}
          className="w-full rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold py-2.5 hover:bg-[#dcc0ff] transition-colors"
        >
          Compare charts
        </button>
      </div>

      {partnerChart && snapshot && (
        <>
          <section className="glow-card rounded-2xl p-6">
            <h2 className="text-lg font-display mb-4">
              {form.placeLabel || 'Their'} placements
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Sun</p>
                <p className="text-lg text-[#e9d9ff]">{partnerChart.points[0].sign}</p>
                <p className="text-xs text-[#8e85a8]">{formatDegree(partnerChart.points[0].longitude)}</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Moon</p>
                <p className="text-lg text-[#e9d9ff]">{partnerChart.points[1].sign}</p>
                <p className="text-xs text-[#8e85a8]">{formatDegree(partnerChart.points[1].longitude)}</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Rising</p>
                <p className="text-lg text-[#e9d9ff]">{partnerChart.ascendant.sign}</p>
                <p className="text-xs text-[#8e85a8]">{formatDegree(partnerChart.ascendant.longitude)}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-display mb-2">Snapshot</h2>
            <p className="text-sm text-[#9a92b3] mb-4">
              {snapshot.total} connection{snapshot.total === 1 ? '' : 's'} found across your two
              charts — {snapshot.harmonious} historically read as harmonious,{' '}
              {snapshot.intensifying} as intensifying, and {snapshot.challenging} as more
              challenging. "Challenging" here means it takes more conscious effort, not that
              anything is doomed — some of the strongest bonds run on a mix of all three.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display mb-2">Your strongest connections</h2>
            {hits.length === 0 ? (
              <p className="text-[#dcd6ec] text-sm leading-relaxed">
                Nothing within a tight orb this time — a quieter chart-to-chart connection, at
                least among the personal planets and Ascendant.
              </p>
            ) : (
              <div className="space-y-3">
                {hits.slice(0, 8).map((h, i) => (
                  <div key={i} className="glow-card rounded-xl p-4">
                    <p className="text-[#dcd6ec] text-sm leading-relaxed">
                      Your <span className="text-[#e9d9ff] font-semibold">{h.personAPoint}</span>{' '}
                      forms a <span className="text-[#e9d9ff] font-semibold">{h.aspect}</span> to
                      their <span className="text-[#e9d9ff] font-semibold">{h.personBPoint}</span>{' '}
                      — a {NATURE_LABEL[h.nature]} placement around {h.theme}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default function Synastry() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Synastry</h1>
      <p className="text-[#c9c2dd] mb-8">
        Compare your chart with someone else's — a friend, a partner, anyone you're curious
        about. This is a lens for noticing dynamics, not a verdict on the relationship.
      </p>

      <UpgradeGate
        required="plus"
        teaser="Compare your chart with a friend or partner's — see exactly which placements connect, and how."
      >
        <SynastryContent />
      </UpgradeGate>
    </div>
  )
}
