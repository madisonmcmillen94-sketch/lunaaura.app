import { useEffect, useRef, useState } from 'react'

// A guided-breathing orb paired with an optional steady tone. Framed the
// same way as the rest of the app (see the footer disclaimer): a spiritual
// / nervous-system practice, not a medical treatment, and the tones are
// offered as a calming ritual, not a scientifically validated cure.

type PatternKey = 'box' | 'calm478' | 'simple'

const PATTERNS: Record<PatternKey, { label: string; phases: { name: 'Inhale' | 'Hold' | 'Exhale'; seconds: number }[] }> = {
  calm478: {
    label: 'Calming 4-7-8',
    phases: [
      { name: 'Inhale', seconds: 4 },
      { name: 'Hold', seconds: 7 },
      { name: 'Exhale', seconds: 8 },
    ],
  },
  box: {
    label: 'Box breathing (4-4-4-4)',
    phases: [
      { name: 'Inhale', seconds: 4 },
      { name: 'Hold', seconds: 4 },
      { name: 'Exhale', seconds: 4 },
      { name: 'Hold', seconds: 4 },
    ],
  },
  simple: {
    label: 'Simple 4-4',
    phases: [
      { name: 'Inhale', seconds: 4 },
      { name: 'Exhale', seconds: 4 },
    ],
  },
}

const FREQUENCIES = [
  { hz: 174, label: '174 Hz — Grounding' },
  { hz: 285, label: '285 Hz — Restoring' },
  { hz: 396, label: '396 Hz — Releasing' },
  { hz: 417, label: '417 Hz — Clearing' },
  { hz: 432, label: '432 Hz — Calming' },
  { hz: 528, label: '528 Hz — Renewal' },
  { hz: 639, label: '639 Hz — Connection' },
  { hz: 741, label: '741 Hz — Clarity' },
  { hz: 852, label: '852 Hz — Awareness' },
  { hz: 963, label: '963 Hz — Stillness' },
]

const DURATIONS_MIN = [3, 5, 10, 15]

export default function Breathe() {
  const [pattern, setPattern] = useState<PatternKey>('calm478')
  const [freqHz, setFreqHz] = useState<number | null>(432)
  const [durationMin, setDurationMin] = useState(5)
  const [volume, setVolume] = useState(0.15)

  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [heldScale, setHeldScale] = useState(1)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const phases = PATTERNS[pattern].phases
  const totalSeconds = durationMin * 60
  const currentPhase = phases[phaseIndex]

  function startTone(hz: number) {
    const ctx = audioCtxRef.current ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    audioCtxRef.current = ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = hz
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5)
    oscRef.current = osc
    gainRef.current = gain
  }

  function stopTone() {
    const ctx = audioCtxRef.current
    const gain = gainRef.current
    const osc = oscRef.current
    if (ctx && gain && osc) {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1)
      window.setTimeout(() => {
        try {
          osc.stop()
        } catch {
          // already stopped -- fine
        }
      }, 1100)
    }
    oscRef.current = null
    gainRef.current = null
  }

  function handleStart() {
    setPhaseIndex(0)
    setPhaseSecondsLeft(phases[0].seconds)
    setHeldScale(1)
    setSecondsElapsed(0)
    setRunning(true)
    if (freqHz) startTone(freqHz)
  }

  function handleStop() {
    setRunning(false)
    stopTone()
  }

  // Tick the session clock and the current phase's countdown. Advancing to
  // the next phase is done via a functional update on phaseIndex so this
  // interval doesn't need to be torn down and rebuilt every second.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSecondsElapsed((s) => {
        const next = s + 1
        if (next >= totalSeconds) {
          window.setTimeout(() => handleStop(), 0)
        }
        return next
      })
      setPhaseSecondsLeft((s) => {
        if (s <= 1) {
          setPhaseIndex((idx) => (idx + 1) % phases.length)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, pattern, totalSeconds])

  // When the phase actually changes, reset its countdown and remember
  // which way the orb should be resting during the next Hold.
  useEffect(() => {
    if (!running) return
    setPhaseSecondsLeft(phases[phaseIndex]?.seconds ?? 4)
    if (phases[phaseIndex]?.name === 'Inhale') setHeldScale(1.35)
    if (phases[phaseIndex]?.name === 'Exhale') setHeldScale(0.85)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex])

  // Live volume changes while a session is running.
  useEffect(() => {
    if (running && gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(volume, audioCtxRef.current.currentTime + 0.3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume])

  // Clean up the audio graph if the person navigates away mid-session.
  useEffect(() => {
    return () => {
      stopTone()
      audioCtxRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scale =
    currentPhase?.name === 'Hold' ? heldScale : currentPhase?.name === 'Inhale' ? 1.35 : currentPhase?.name === 'Exhale' ? 0.85 : 1
  const transitionSeconds = currentPhase?.seconds ?? 4
  const minutesLeft = Math.max(0, Math.ceil((totalSeconds - secondsElapsed) / 60))

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Breathe</h1>
      <p className="text-[#9a92b3] mb-8">
        A floating orb to breathe with, paired with a steady tone. A few minutes to settle your
        nervous system -- not a medical treatment.
      </p>

      <div className="glow-card rounded-2xl p-8 flex flex-col items-center mb-6">
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #dcc0ff, #caa6ff 45%, #6b46c1 100%)',
              boxShadow: '0 0 60px 10px rgba(202,166,255,0.35)',
              transform: `scale(${running ? scale : 1})`,
              transition: `transform ${transitionSeconds}s ease-in-out`,
            }}
          />
          <span className="relative z-10 text-[#1a0f2e] font-semibold text-lg">
            {running ? currentPhase?.name : 'Ready'}
          </span>
        </div>

        {running ? (
          <>
            <p className="text-sm text-[#8e85a8] mb-4">
              {minutesLeft} min left &middot; {phaseSecondsLeft}s
            </p>
            <button
              onClick={handleStop}
              className="rounded-full border border-[#caa6ff]/50 text-[#e9d9ff] px-6 py-2 text-sm hover:bg-[#caa6ff]/10 transition-colors"
            >
              Stop
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-8 py-3 hover:bg-[#dcc0ff] transition-colors"
          >
            Begin
          </button>
        )}
      </div>

      <div className="glow-card rounded-2xl p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-2">Pattern</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PATTERNS) as PatternKey[]).map((key) => (
              <button
                key={key}
                disabled={running}
                onClick={() => setPattern(key)}
                className={`text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-40 ${
                  pattern === key
                    ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#e9d9ff]'
                    : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
                }`}
              >
                {PATTERNS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-2">Tone</p>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={running}
              onClick={() => setFreqHz(null)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-40 ${
                freqHz === null
                  ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#e9d9ff]'
                  : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
              }`}
            >
              Silent
            </button>
            {FREQUENCIES.map((f) => (
              <button
                key={f.hz}
                disabled={running}
                onClick={() => setFreqHz(f.hz)}
                className={`text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-40 ${
                  freqHz === f.hz
                    ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#e9d9ff]'
                    : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-2">Length</p>
            <div className="flex gap-2">
              {DURATIONS_MIN.map((d) => (
                <button
                  key={d}
                  disabled={running}
                  onClick={() => setDurationMin(d)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors disabled:opacity-40 ${
                    durationMin === d
                      ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#e9d9ff]'
                      : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-2">Volume</p>
            <input
              type="range"
              min={0}
              max={0.4}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-[#caa6ff]"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-[#6b6280] mt-6">
        These tones are offered as a calming ritual, not a scientifically proven healing
        frequency. If you're dealing with something that needs medical care, please talk to a
        licensed provider.
      </p>
    </div>
  )
}
