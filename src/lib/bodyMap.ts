import type { ZodiacSign } from './zodiac'

export interface BodyMapEntry {
  region: string
  note: string
  attention: string
}

// The traditional sign-to-body map (melothesia): in the old medical-astrology
// tradition, each sign was mapped to a part of the body -- Aries to the head,
// Pisces to the feet -- and the chart was read alongside the person, never
// instead of them. This is tradition, labeled as tradition -- a lens for
// noticing what's already happening in the body, not a diagnosis, not
// causation, and never a reading of symptoms. The attention prompts are drawn
// from general somatic self-regulation approaches (grounding, orienting, slow
// breath, gentle movement) -- open, widely-taught techniques, not any closed
// or initiated tradition.
export const BODY_MAP: Record<ZodiacSign, BodyMapEntry> = {
  Aries: {
    region: 'the head and face',
    note: 'In the old tradition, Aries was mapped to the head and face.',
    attention:
      'Rest your eyes. Unclench your jaw, soften your forehead, and notice what is loud up here before you decide anything.',
  },
  Taurus: {
    region: 'the neck, throat, and jaw',
    note: 'In the old tradition, Taurus was mapped to the neck, throat, and jaw.',
    attention:
      'Roll your neck gently, swallow slowly, hum on one long exhale. Notice where your voice lives today.',
  },
  Gemini: {
    region: 'the shoulders, arms, and hands',
    note: 'In the old tradition, Gemini was mapped to the shoulders, arms, and hands.',
    attention:
      'Shake out your hands, roll your shoulders down and back, and notice the breath moving in your upper chest.',
  },
  Cancer: {
    region: 'the chest and stomach',
    note: 'In the old tradition, Cancer was mapped to the chest and stomach.',
    attention:
      'One hand on your chest, one on your stomach. Breathe slowly and notice which one you are guarding.',
  },
  Leo: {
    region: 'the heart and the back',
    note: 'In the old tradition, Leo was mapped to the heart and the back.',
    attention:
      'Stand tall, draw the shoulder blades gently together, then let them go. Notice your posture before your mood.',
  },
  Virgo: {
    region: 'the belly',
    note: 'In the old tradition, Virgo was mapped to the belly.',
    attention:
      'Rest a hand on your belly and let it be soft for ten breaths. Notice what it does when you stop holding it in.',
  },
  Libra: {
    region: 'the lower back and loins',
    note: 'In the old tradition, Libra was mapped to the lower back and loins.',
    attention:
      'Bend gently side to side, then stand still and compare left and right. Notice where balance is easy and where it is work.',
  },
  Scorpio: {
    region: 'the pelvis',
    note: 'In the old tradition, Scorpio was mapped to the pelvis.',
    attention:
      'Sit and feel your weight through your sit bones. On each exhale, let the pelvic floor drop and soften.',
  },
  Sagittarius: {
    region: 'the hips and thighs',
    note: 'In the old tradition, Sagittarius was mapped to the hips and thighs.',
    attention:
      'Walk for two minutes, or circle your hips slowly. Notice any restlessness asking your legs to move.',
  },
  Capricorn: {
    region: 'the knees, bones, and joints',
    note: 'In the old tradition, Capricorn was mapped to the knees, bones, and joints.',
    attention:
      'Bend and straighten your knees slowly, then your elbows. Notice where you brace, and what happens when you stop.',
  },
  Aquarius: {
    region: 'the lower legs and ankles',
    note: 'In the old tradition, Aquarius was mapped to the lower legs and ankles.',
    attention:
      'Circle your ankles, stretch your calves, press your heels down. Notice warmth, tingling, restlessness — sensation only.',
  },
  Pisces: {
    region: 'the feet',
    note: 'In the old tradition, Pisces was mapped to the feet.',
    attention:
      'Press your feet into the floor, spread your toes, then let the ground hold them. Notice what your soles report.',
  },
}

export const BODY_MAP_TITLE = 'Your chart, in your body'

export const BODY_MAP_INTRO =
  'The oldest charts were body records. In the medical-astrology tradition, every sign was mapped to a part of the body — Aries to the head, Pisces to the feet — and the chart was read alongside the person, never instead of them. LunaAura keeps that order: it starts with knowing your body, and knowing yourself. Read yours the old way — as tradition, a lens for noticing. Never a diagnosis.'

export const BODY_MAP_RISING_PREFIX =
  'Your Rising sign anchors the map — in the tradition, the Rising sign is the body itself, the part of the chart that is you, physically, arriving.'

export const BODY_MAP_CLOSING =
  'When a region has something to say, write it in your Journal. Your own record is the test.'

export const BODY_MAP_FOOTER =
  'The body map is tradition, not medicine: it does not diagnose, predict, or replace care. It points your attention; your body supplies the facts.'

export function bodyFor(sign: string): BodyMapEntry {
  return BODY_MAP[sign as ZodiacSign]
}
