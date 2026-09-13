import { useEffect, useState } from 'react'
import { getMoonInfo } from '../lib/moon'
import { loadEntries, saveEntry, deleteEntry, type JournalEntry } from '../lib/journal'

const moodWords = ['Calm', 'Foggy', 'Activated', 'Tender', 'Grounded', 'Restless', 'Clear', 'Heavy']

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [mood, setMood] = useState(moodWords[0])
  const [bodyNotes, setBodyNotes] = useState('')
  const [freeform, setFreeform] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setEntries(await loadEntries())
      setError(null)
    } catch (e) {
      console.error(e)
      setError('Could not load your entries right now. They’re still safe — try refreshing in a moment.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const moon = getMoonInfo()
      await saveEntry({
        date: new Date().toISOString().slice(0, 10),
        moonPhase: moon.phaseName,
        moodWord: mood,
        bodyNotes,
        freeform,
      })
      setBodyNotes('')
      setFreeform('')
      await refresh()
    } catch (e) {
      console.error(e)
      setError('Couldn’t save that check-in — check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      console.error(e)
      setError('Couldn’t delete that entry — try again.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Nervous System Journal</h1>
      <p className="text-[#c9c2dd] mb-8">
        A quick daily check-in. Over time, this is how you find your own patterns —
        not what a chart says should be true, but what actually is, for you.
      </p>

      {error && (
        <p className="mb-4 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="glow-card rounded-2xl p-6 mb-10 space-y-4">
        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">How does your body feel right now?</label>
          <div className="flex flex-wrap gap-2">
            {moodWords.map((w) => (
              <button
                key={w}
                onClick={() => setMood(w)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  mood === w
                    ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#f1e8ff]'
                    : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">Where do you feel it in your body?</label>
          <input
            value={bodyNotes}
            onChange={(e) => setBodyNotes(e.target.value)}
            placeholder="e.g. tight chest, restless legs, heavy shoulders"
            className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
          />
        </div>

        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">Anything else?</label>
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : "Save today's check-in"}
        </button>
        <p className="text-xs text-[#8e85a8]">
          Saved to your own private account on this site (no email/password needed) — syncs across
          devices where you’re signed in the same way.
        </p>
      </div>

      <h2 className="text-xl font-display mb-4">Your entries</h2>
      {loading && <p className="text-[#8e85a8] text-sm">Loading your entries…</p>}
      {!loading && entries.length === 0 && (
        <p className="text-[#8e85a8] text-sm">No entries yet — your first check-in will show up here.</p>
      )}
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="glow-card rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#b6acd1] mb-1">
                {e.date} · {e.moonPhase} · <span className="text-[#e9d9ff]">{e.moodWord}</span>
              </p>
              {e.bodyNotes && <p className="text-sm text-[#dcd6ec]">Body: {e.bodyNotes}</p>}
              {e.freeform && <p className="text-sm text-[#dcd6ec] mt-1">{e.freeform}</p>}
            </div>
            <button
              onClick={() => handleDelete(e.id)}
              className="text-xs text-[#8e85a8] hover:text-[#e9e4f5] shrink-0"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
