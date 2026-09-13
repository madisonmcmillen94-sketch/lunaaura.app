import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadNatalChart } from '../lib/natalStorage'
import { findTransits, type TransitHit } from '../lib/transits'
import { getSomaticGuidance } from '../lib/somatic'
import type { NatalChart } from '../lib/natal'

const ASPECT_VERB: Record<TransitHit['aspect'], string> = {
  Conjunction: 'is conjunct',
  Sextile: 'sextiles',
  Square: 'squares',
  Trine: 'trines',
  Opposition: 'opposes',
}

const NATURE_DOT: Record<TransitHit['nature'], string> = {
  harmonious: 'bg-[#9ee6b8]',
  intensifying: 'bg-[#caa6ff]',
  challenging: 'bg-[#ffb4b4]',
}

/** The Plus-tier feature: today's tightest transits to the signed-in visitor's own chart, each paired with a somatic (body-based) practice. */
export default function PersonalTransits() {
  const [state, setState] = useState<'loading' | 'no-chart' | 'ready' | 'error'>('loading')
  const [hits, setHits] = useState<TransitHit[]>([])

  useEffect(() => {
    let cancelled = false
    loadNatalChart()
      .then((chart: NatalChart | null) => {
        if (cancelled) return
        if (!chart) {
          setState('no-chart')
          return
        }
        setHits(findTransits(chart).slice(0, 3))
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return <p className="text-sm text-[#9a92b3]">Reading your personal transits…</p>
  }

  if (state === 'no-chart') {
    return (
      <div className="text-center">
        <p className="text-[#dcd6ec] mb-4">
          Add your birth details to see how today's sky is touching your own chart.
        </p>
        <Link
          to="/chart"
          className="inline-block rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
        >
          Add my chart
        </Link>
      </div>
    )
  }

  if (state === 'error') {
    return <p className="text-sm text-[#ffb4b4]">Couldn't load your personal transits right now — try refreshing.</p>
  }

  if (hits.length === 0) {
    return (
      <p className="text-[#dcd6ec] text-sm leading-relaxed">
        Nothing is closely aspecting your chart today — a comparatively quiet stretch, personally speaking.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {hits.map((hit, i) => {
        const guidance = getSomaticGuidance(hit)
        return (
          <div key={i} className={i > 0 ? 'pt-5 border-t border-white/10' : ''}>
            <p className="text-sm text-[#b6acd1] mb-1.5 flex items-center gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${NATURE_DOT[hit.nature]}`} />
              Transiting {hit.transitingPlanet} {ASPECT_VERB[hit.aspect]} your natal {hit.natalPoint}
            </p>
            <p className="text-[#dcd6ec] leading-relaxed mb-2">{guidance.theme}</p>
            <p className="text-sm text-[#b6acd1]">
              <span className="font-semibold text-[#e9d9ff]">Try this: </span>
              {guidance.practice}
            </p>
          </div>
        )
      })}
    </div>
  )
}
