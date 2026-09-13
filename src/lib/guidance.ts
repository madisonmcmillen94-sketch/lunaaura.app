import type { MoonInfo, MoonPhaseName } from './moon'
import type { GeomagneticSummary, QuakeSummary } from './earth'

// This file translates real astronomical/geophysical inputs into intuitive,
// nervous-system-facing guidance. It is written as a spiritual/somatic
// practice tool (in the same voice as the LunaAura brand), not as medical
// or clinical guidance — the UI states this distinction explicitly.

export const moonPhaseGuidance: Record<MoonPhaseName, { theme: string; nervousSystem: string; practice: string }> = {
  'New Moon': {
    theme: 'Rest, root, and set intention',
    nervousSystem:
      'Energy tends to sit low and inward here. If you feel more tired, quiet, or slow to respond than usual, your system may simply be asking for rest rather than pushing through.',
    practice: 'Write down one intention. Keep your evening unscheduled. Let stillness be productive.',
  },
  'Waxing Crescent': {
    theme: 'Gentle momentum',
    nervousSystem:
      'A good window for steady activation without overwhelm — your system can usually handle a bit more stimulation than at the New Moon.',
    practice: 'Take one small, concrete step on the intention you set. Notice, don’t force.',
  },
  'First Quarter': {
    theme: 'Friction and decision',
    nervousSystem:
      'Tension or irritability that shows up now is often information, not malfunction — a signal that something needs a decision or an adjustment.',
    practice: 'Name the obstacle out loud. Choose one action instead of trying to resolve everything.',
  },
  'Waxing Gibbous': {
    theme: 'Refinement',
    nervousSystem:
      'Your system may feel more sensitive to detail and correction right now — helpful for editing, less helpful for starting something new.',
    practice: 'Review and adjust rather than launch. Give your eyes and body real breaks from screens.',
  },
  'Full Moon': {
    theme: 'Peak activation, peak feeling',
    nervousSystem:
      'This is the phase most people notice in their body — lighter sleep, bigger emotions, more sensory sensitivity are common self-reports here. None of that means something is wrong.',
    practice: 'Lower stimulation in the evening. Move the body to discharge activation. Journal instead of reacting.',
  },
  'Waning Gibbous': {
    theme: 'Gratitude and release',
    nervousSystem:
      'A natural come-down period. If you feel emotionally tender, it may be residual activation from the Full Moon settling.',
    practice: 'Say what you’re grateful for. Let go of one commitment that no longer fits.',
  },
  'Last Quarter': {
    theme: 'Letting go',
    nervousSystem:
      'Old patterns can surface for closure now. Restlessness or a short fuse is common as your system clears what it no longer needs.',
    practice: 'Do a small closing ritual — clear a space, end a conversation, finish a task you’ve been avoiding.',
  },
  'Waning Crescent': {
    theme: 'Surrender before the reset',
    nervousSystem:
      'The lowest-output phase of the cycle. Fatigue here is expected, not a personal failing.',
    practice: 'Slow your pace on purpose. Prepare gently for the next New Moon rather than starting something big.',
  },
}

export function retrogradeGuidance(planets: string[]): string | null {
  if (planets.length === 0) return null
  const list = planets.join(', ')
  if (planets.includes('Mercury')) {
    return `${list} retrograde — communication, travel, and tech may feel glitchier than usual. If you’re misread or misreading others, slow down before reacting; re-checking is part of the rhythm right now, not a sign you’re failing.`
  }
  return `${list} retrograde — this is traditionally a season for revisiting rather than launching. If you feel pulled to redo or reconsider something, that pull is worth listening to.`
}

export function quakeGuidance(q: QuakeSummary): string | null {
  if (q.maxMagnitude === null) return null
  if (q.maxMagnitude >= 6) {
    return `The Earth has had a significant seismic event in the last couple of days (M${q.maxMagnitude.toFixed(1)}, ${q.strongestPlace ?? 'location unclear'}). Some people report feeling generally unsettled or extra alert during periods of high global seismic activity, even far from the epicenter — that’s a real, if unproven, experience worth naming rather than dismissing.`
  }
  if (q.count24h > 40) {
    return `It’s been an active couple of days for the Earth’s crust globally (${q.count24h} recorded quakes of M2.5+). If your baseline restlessness feels higher than usual, this is one plausible thread among many.`
  }
  return null
}

export function geomagneticGuidance(g: GeomagneticSummary): string | null {
  if (g.status === 'storm') {
    return `Geomagnetic activity is elevated (Kp ${g.kIndex}). Some people notice disrupted sleep, headaches, or a foggy, ungrounded feeling during geomagnetic storms. If that’s you today, it’s a known, if not fully understood, pattern — not something to push through.`
  }
  if (g.status === 'active') {
    return `Geomagnetic activity is a bit elevated today (Kp ${g.kIndex}). Mild edge or distractibility wouldn’t be unusual.`
  }
  return null
}

export interface ForecastCopy {
  headline: string
  moon: ReturnType<typeof moonThemeCopy>
  retrograde: string | null
  quake: string | null
  geomagnetic: string | null
  closing: string
}

function moonThemeCopy(moon: MoonInfo) {
  const g = moonPhaseGuidance[moon.phaseName]
  return {
    phaseName: moon.phaseName,
    illuminationPct: Math.round(moon.illumination * 100),
    theme: g.theme,
    nervousSystem: g.nervousSystem,
    practice: g.practice,
  }
}

export function buildForecastCopy(
  moon: MoonInfo,
  retrograde: string[],
  quake: QuakeSummary,
  geomagnetic: GeomagneticSummary
): ForecastCopy {
  return {
    headline: `${moon.phaseName} — ${Math.round(moon.illumination * 100)}% illuminated`,
    moon: moonThemeCopy(moon),
    retrograde: retrogradeGuidance(retrograde),
    quake: quakeGuidance(quake),
    geomagnetic: geomagneticGuidance(geomagnetic),
    closing:
      'None of this is a diagnosis or a reason to skip care that’s working for you. Think of it as another language for what your body may already be telling you.',
  }
}
