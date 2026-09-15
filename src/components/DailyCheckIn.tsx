import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadEntries, saveEntry, MOOD_WORDS, type JournalEntry } from '../lib/journal'
import { getMoonInfo } from '../lib/moon'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * A sub-30-second mood check-in on the Forecast page -- the "high-frequency
 * value" nudge that brings people back twice a day, separate from the full
 * Journal form. It writes a normal journal entry (tagged checkInType), so it
 * counts toward the same streaks and Patterns dashboard as anything logged
 * on the Journal page itself -- no separate data model to keep in sync.
 */
export default function DailyCheckIn() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEntries()
      .then(setEntries)
      .catch((e) => {
        console.error(e)
        setEntries([])
      })
  }, [])

  if (!entries) return null

  const period: 'morning' | 'evening' = new Date().getHours() < 12 ? 'morning' : 'evening'
  const today = todayIso()
  const alreadyLogged = entries.some((e) => e.date === today && e.checkInType === period)

  async function logCheckIn(mood: string) {
    setSaving(true)
    setError(null)
    try {
      const moon = getMoonInfo()
      await saveEntry({
        date: today,
        moonPhase: moon.phaseName,
        moodWord: mood,
        bodyNotes: '',
        freeform: '',
        transitSnapshot: null,
        checkInType: period,
      })
      setEntries(await loadEntries())
    } catch (e) {
      console.error(e)
      setError('Couldn’t save that check-in — try again in a moment.')
    } finally {
      setSaving(false)
    }
  }

  if (alreadyLogged) {
    return (
      <div className="glow-card rounded-2xl p-5 mb-6 flex items-center gap-3">
        <span className="text-[#caa6ff] text-lg">✓</span>
        <p className="text-sm text-[#c9c2dd]">
          {period === 'morning' ? 'Morning' : 'Evening'} check-in logged —{' '}
          {period === 'morning' ? 'see you tonight.' : 'see you tomorrow morning.'}
        </p>
      </div>
    )
  }

  return (
    <div className="glow-card rounded-2xl p-5 mb-6">
      <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">
        {period === 'morning' ? 'Morning check-in' : 'Evening check-in'}
      </p>
      <p className="text-sm text-[#dcd6ec] mb-3">
        {period === 'morning'
          ? 'Thirty seconds before the day gets away from you — how does your body feel right now?'
          : 'Before you wind down — how did today actually feel?'}
      </p>
      {error && <p className="text-xs text-[#ffb4b4] mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-3">
        {MOOD_WORDS.map((m) => (
          <button
            key={m}
            disabled={saving}
            onClick={() => logCheckIn(m)}
            className="px-3 py-1.5 rounded-full text-sm border border-white/15 text-[#c9c2dd] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {m}
          </button>
        ))}
      </div>
      {period === 'morning' && (
        <p className="text-xs text-[#8e85a8]">
          Want a minute of guided breathing to go with it?{' '}
          <Link to="/breathe" className="underline decoration-[#caa6ff]/50 hover:decoration-[#caa6ff]">
            Start here →
          </Link>
        </p>
      )}
    </div>
  )
}
