import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import UpgradeGate from '../components/UpgradeGate'
import { askCompanion, type CompanionTurn } from '../lib/companion'
import { loadNatalChart } from '../lib/natalStorage'

const STARTERS = [
  'What stands out most in my chart?',
  'What is my Moon sign asking of me?',
  "What's moving for me right now?",
  'Where does my chart say I hold tension?',
]

function CompanionContent() {
  const [hasChart, setHasChart] = useState<boolean | null>(null)
  const [turns, setTurns] = useState<CompanionTurn[]>([])
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadNatalChart()
      .then((c) => setHasChart(!!c))
      .catch(() => setHasChart(false))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, asking])

  async function ask(text: string) {
    const trimmed = text.trim()
    if (!trimmed || asking) return

    const history = turns.slice(-6)
    setTurns((prev) => [...prev, { role: 'user', content: trimmed }])
    setQuestion('')
    setAsking(true)
    setError(null)

    try {
      const reply = await askCompanion(trimmed, history)
      setTurns((prev) => [...prev, { role: 'assistant', content: reply.answer }])
      setRemaining(reply.remaining)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong — try again.')
      // Drop the unanswered question so the thread doesn't show a dead end.
      setTurns((prev) => prev.slice(0, -1))
      setQuestion(trimmed)
    } finally {
      setAsking(false)
    }
  }

  if (hasChart === null) {
    return <p className="text-sm text-[#9a92b3]">Loading your chart…</p>
  }

  if (!hasChart) {
    return (
      <div className="text-center py-8">
        <p className="text-[#dcd6ec] mb-4">
          The companion reads from your birth chart — save yours first and it'll have something to
          work with.
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

  return (
    <div>
      {turns.length === 0 && (
        <div className="glow-card rounded-2xl p-5 mb-6">
          <p className="text-sm text-[#dcd6ec] mb-3">
            Ask anything about your chart. It answers from your actual placements — and it'll tell
            you when something isn't a question a chart can answer.
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => void ask(s)}
                className="px-3 py-1.5 rounded-full text-sm border border-white/15 text-[#c9c2dd] hover:bg-white/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {turns.map((turn, i) => (
          <div
            key={`${turn.role}-${i}`}
            className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                turn.role === 'user'
                  ? 'bg-[#caa6ff]/20 border border-[#caa6ff]/40 text-[#f1e8ff]'
                  : 'glow-card text-[#dcd6ec]'
              }`}
            >
              {turn.content}
            </div>
          </div>
        ))}

        {asking && (
          <div className="flex justify-start">
            <div className="glow-card rounded-2xl px-4 py-3 text-sm text-[#9a92b3]">Reading your chart…</div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-[#ffb4b4] mb-3 leading-relaxed">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void ask(question)
            }
          }}
          rows={2}
          maxLength={600}
          placeholder="Ask about a placement, a pattern, or what's moving today…"
          className="flex-1 min-w-0 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60 resize-none"
        />
        <button
          onClick={() => void ask(question)}
          disabled={asking || !question.trim()}
          className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-5 self-end py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-40 shrink-0"
        >
          Ask
        </button>
      </div>

      <div className="flex flex-wrap justify-between gap-2 mt-3">
        <p className="text-xs text-[#6b6280] leading-relaxed max-w-md">
          A reflection tool, not a clinician or a fortune teller. It won't diagnose anything or tell
          you what to decide.
        </p>
        {remaining !== null && (
          <p className="text-xs text-[#6b6280]">{remaining} questions left today</p>
        )}
      </div>
    </div>
  )
}

export default function Companion() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Ask your chart</h1>
      <p className="text-[#c9c2dd] mb-8">
        A companion that reads your actual placements with you — for noticing patterns, not for
        being told who you are.
      </p>

      <UpgradeGate
        required="all_access"
        teaser="Ask your chart anything and get answers grounded in your real placements and today's transits — not generic horoscope copy."
      >
        <CompanionContent />
      </UpgradeGate>
    </div>
  )
}
