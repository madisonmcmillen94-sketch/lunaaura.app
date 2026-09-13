import { useEffect, useState } from 'react'
import { getMoonInfo, getMoonSign, type MoonInfo } from '../lib/moon'
import { getRetrogradePlanets } from '../lib/planets'
import { fetchQuakeSummary, fetchGeomagneticSummary, type QuakeSummary, type GeomagneticSummary } from '../lib/earth'
import { buildForecastCopy } from '../lib/guidance'
import UpgradeGate from '../components/UpgradeGate'
import PersonalTransits from '../components/PersonalTransits'

const moonEmoji: Record<string, string> = {
  'New Moon': '🌑',
  'Waxing Crescent': '🌒',
  'First Quarter': '🌓',
  'Waxing Gibbous': '🌔',
  'Full Moon': '🌕',
  'Waning Gibbous': '🌖',
  'Last Quarter': '🌗',
  'Waning Crescent': '🌘',
}

export default function Forecast() {
  const [moon, setMoon] = useState<MoonInfo | null>(null)
  const [moonSign, setMoonSign] = useState<string>('')
  const [retro, setRetro] = useState<string[]>([])
  const [quake, setQuake] = useState<QuakeSummary | null>(null)
  const [geo, setGeo] = useState<GeomagneticSummary | null>(null)
  const [loadingEarth, setLoadingEarth] = useState(true)
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const moonInfo = getMoonInfo(now)
    const sign = getMoonSign(now)
    const retroList = getRetrogradePlanets(now)
    setMoon(moonInfo)
    setMoonSign(sign)
    setRetro(retroList)

    Promise.all([fetchQuakeSummary(), fetchGeomagneticSummary()]).then(([q, g]) => {
      setQuake(q)
      setGeo(g)
      setLoadingEarth(false)

      // Ask the server for today's (cached, once-a-day) AI reading. If it
      // fails for any reason, we silently keep the rule-based copy below.
      fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moonPhase: moonInfo.phaseName,
          illuminationPct: Math.round(moonInfo.illumination * 100),
          moonSign: sign,
          retrogradePlanets: retroList,
          quakeMaxMagnitude: q.maxMagnitude,
          quakeCount24h: q.count24h,
          geomagneticStatus: g.status,
          geomagneticKIndex: g.kIndex,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.text) setAiText(data.text)
        })
        .catch(() => {
          /* silent fallback to rule-based copy */
        })
        .finally(() => setAiLoading(false))
    })
  }, [])

  if (!moon) return null

  const copy = quake && geo ? buildForecastCopy(moon, retro, quake, geo) : null

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <section className="text-center mb-10">
        <div className="text-7xl mb-4">{moonEmoji[moon.phaseName]}</div>
        <h1 className="text-4xl font-display mb-2">{moon.phaseName}</h1>
        <p className="text-[#c9c2dd]">
          {Math.round(moon.illumination * 100)}% illuminated · Moon in {moonSign} · next{' '}
          {moon.daysUntilFullOrNew.type} in {moon.daysUntilFullOrNew.days} day
          {moon.daysUntilFullOrNew.days === 1 ? '' : 's'}
        </p>
      </section>

      <section className="glow-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-display mb-3">{'✨'} Today's reading</h2>
        {aiText ? (
          <div className="text-[#dcd6ec] leading-relaxed space-y-3 whitespace-pre-line">{aiText}</div>
        ) : aiLoading ? (
          <p className="text-sm text-[#9a92b3]">Reading the sky…</p>
        ) : (
          <>
            <p className="text-[#dcd6ec] leading-relaxed mb-4">{(copy ?? { moon: { nervousSystem: '' } }).moon.nervousSystem}</p>
            <p className="text-sm text-[#b6acd1]">
              <span className="font-semibold text-[#e9d9ff]">Try this: </span>
              {(copy ?? { moon: { practice: '' } }).moon.practice}
            </p>
          </>
        )}
      </section>

      <section className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="glow-card rounded-2xl p-5">
          <h3 className="text-sm uppercase tracking-wide text-[#b6acd1] mb-2">Planetary weather</h3>
          {retro.length > 0 ? (
            <p className="text-[#dcd6ec] text-sm leading-relaxed">{copy?.retrograde}</p>
          ) : (
            <p className="text-[#dcd6ec] text-sm leading-relaxed">
              No tracked planets are retrograde right now — a comparatively steady stretch.
            </p>
          )}
        </div>
        <div className="glow-card rounded-2xl p-5">
          <h3 className="text-sm uppercase tracking-wide text-[#b6acd1] mb-2">Earth activity</h3>
          {loadingEarth ? (
            <p className="text-sm text-[#9a92b3]">Reading live data…</p>
          ) : (
            <div className="text-sm text-[#dcd6ec] leading-relaxed space-y-2">
              <p>{copy?.quake ?? 'Global seismic activity is within its typical range.'}</p>
              <p>{copy?.geomagnetic ?? 'Geomagnetic activity is quiet.'}</p>
            </div>
          )}
        </div>
      </section>

      <section className="glow-card rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-display mb-4">🪐 Your personal transits</h2>
        <UpgradeGate
          required="plus"
          teaser="See exactly which planets are touching your own chart today, each paired with a body-based practice for that specific activation."
        >
          <PersonalTransits />
        </UpgradeGate>
      </section>

      <p className="text-xs text-[#8e85a8] text-center leading-relaxed">
        {copy?.closing ?? 'None of this is a diagnosis or a reason to skip care that’s working for you.'}
      </p>
    </div>
  )
}
