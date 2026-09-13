import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { markOnboarded } from '../lib/auth'

const SLIDES = [
  {
    emoji: '🌙',
    title: 'Welcome to LunaAura',
    body: "A guide to lunar, planetary, and earth rhythms — and how they show up in your own nervous system. Here's a quick look around.",
  },
  {
    emoji: '✨',
    title: 'Forecast',
    body: "Your home page — today's moon phase, planetary weather, and earth activity, with a daily reading grounded in real astronomy.",
  },
  {
    emoji: '🪐',
    title: 'Your Chart',
    body: "Your birth chart, calculated from the date, time, and place you entered, plus a daily breakdown of how today's sky is touching your own placements.",
  },
  {
    emoji: '📓',
    title: 'Journal',
    body: 'A quick, private check-in on how your body feels. Over time this is how you find your own patterns — not what a chart says should be true.',
  },
]

/**
 * A one-time welcome tour shown to a real (non-anonymous) account that
 * hasn't seen it yet. Rendered globally so it can appear over any page.
 */
export default function OnboardingTour() {
  const { user, profile, isAccount } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dismissing, setDismissing] = useState(false)

  const shouldShow = isAccount && !!profile && !profile.onboardedAt && !dismissing
  if (!shouldShow || !user) return null

  const isLast = step === SLIDES.length - 1
  const slide = SLIDES[step]

  async function finish() {
    setDismissing(true)
    try {
      if (user) await markOnboarded(user.uid)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-[#150f28] border border-white/10 p-8 text-center">
        <div className="text-5xl mb-4">{slide.emoji}</div>
        <h2 className="text-2xl font-display mb-3">{slide.title}</h2>
        <p className="text-[#c9c2dd] leading-relaxed mb-8">{slide.body}</p>

        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#caa6ff]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button onClick={finish} className="text-sm text-[#8e85a8] hover:text-[#e9e4f5]">
            Skip
          </button>
          {isLast ? (
            <button
              onClick={async () => {
                await finish()
                navigate('/chart')
              }}
              className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
            >
              Get started
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
