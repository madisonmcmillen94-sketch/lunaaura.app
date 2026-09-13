import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadEntries, type JournalEntry } from '../lib/journal'
import { overallMoodStats, findTransitMoodPatterns } from '../lib/patterns'
import UpgradeGate from '../components/UpgradeGate'

const NATURE_LABEL: Record<string, string> = {
  harmonious: 'a harmonious aspect to',
  intensifying: 'conjunct',
  challenging: 'a challenging aspect to',
}

function PatternsContent() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
      .then(setEntries)
      .catch((e) => {
        console.error(e)
        setError('Could not load your journal history right now — try refreshing.')
      })
  }, [])

  if (error) {
    return <p className="text-sm text-[#ffb4b4]">{error}</p>
  }

  if (!entries) {
    return <p className="text-sm text-[#9a92b3]">Reading your history…</p>
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#dcd6ec] mb-4">
          No journal entries yet — your first few check-ins will start building your patterns here.
        </p>
        <Link
          to="/journal"
          className="inline-block rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
        >
          Log a check-in
        </Link>
      </div>
    )
  }

  const overall = overallMoodStats(entries)
  const transitPatterns = findTransitMoodPatterns(entries)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-display mb-4">How you've been</h2>
        <div className="space-y-2">
          {overall.tallies.map((t) => (
            <div key={t.word} className="flex items-center gap-3">
              <span className="w-20 text-sm text-[#c9c2dd] shrink-0">{t.word}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#caa6ff]"
                  style={{ width: `${Math.max(4, Math.round(t.pct * 100))}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-[#9a92b3] shrink-0">{t.count}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8e85a8] mt-3">
          {overall.total} check-in{overall.total === 1 ? '' : 's'} logged.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-display mb-2">Your patterns with the sky</h2>
        <p className="text-sm text-[#9a92b3] mb-4">
          What you've actually logged when each kind of transit was active on your chart — not what a
          chart says should be true.
        </p>
        {transitPatterns.length === 0 ? (
          <p className="text-[#dcd6ec] text-sm leading-relaxed">
            Not enough overlapping data yet — keep logging check-ins (with your chart saved) and
            patterns will start to show up here after a few more entries.
          </p>
        ) : (
          <div className="space-y-3">
            {transitPatterns.slice(0, 8).map((p, i) => (
              <div key={i} className="glow-card rounded-xl p-4">
                <p className="text-[#dcd6ec] text-sm leading-relaxed">
                  When <span className="text-[#e9d9ff] font-semibold">{p.planet}</span> was in{' '}
                  {NATURE_LABEL[p.nature]} your chart, you logged{' '}
                  <span className="text-[#e9d9ff] font-semibold">"{p.topMood.word}"</span>{' '}
                  {p.topMood.count} of {p.totalEntries} times ({Math.round(p.topMood.pct * 100)}%).
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function Patterns() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Your Patterns</h1>
      <p className="text-[#c9c2dd] mb-8">
        Your own journal, correlated against your own chart, over time. This is how you find what
        actually holds true for you — not a fixed script.
      </p>

      <UpgradeGate
        required="all_access"
        teaser="See which transits actually correlate with how you've logged feeling — built from your own journal history, not a generic reading."
      >
        <PatternsContent />
      </UpgradeGate>
    </div>
  )
}
