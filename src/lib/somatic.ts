import type { TransitHit, AspectNature } from './transits'

export interface SomaticGuidance {
  theme: string
  practice: string
}

type PlanetKey =
  | 'Moon' | 'Mercury' | 'Venus' | 'Sun' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'

// Each transiting planet maps to a felt nervous-system theme, in three flavors
// depending on whether the aspect is easeful (harmonious), amplifying
// (intensifying, i.e. a conjunction), or frictional (challenging). This is a
// lens for noticing what's already happening in the body -- not a diagnosis,
// not causation. Practices are drawn from general somatic/nervous-system
// self-regulation approaches (orienting, grounding, titration, discharge) --
// open, widely-taught techniques, not any closed or initiated tradition.
const GUIDANCE: Record<PlanetKey, Record<AspectNature, SomaticGuidance>> = {
  Moon: {
    intensifying: {
      theme: "Whatever you're feeling today is close to the surface, not buried.",
      practice: 'Name the feeling in one word, out loud if you can. Naming it tends to lower its charge.',
    },
    harmonious: {
      theme: 'Emotion is moving through you without much resistance today.',
      practice: 'Let yourself actually feel the good parts -- a few slow breaths while it registers, not just noticing and moving on.',
    },
    challenging: {
      theme: 'Emotional reactivity may be quicker to trigger than usual.',
      practice: 'Before responding to anything charged, take one long exhale (longer than the inhale) to nudge your system out of react-mode.',
    },
  },
  Mercury: {
    intensifying: {
      theme: 'Your mind may be looping on something -- more talkative or wired than usual.',
      practice: 'Get it out of your head and onto paper. A messy brain-dump, not a polished one.',
    },
    harmonious: {
      theme: 'Thinking and communicating feel unusually clear today.',
      practice: "Good day to say the thing you've been meaning to say -- your nervous system has some spare bandwidth for it.",
    },
    challenging: {
      theme: 'Thoughts may feel scattered or anxious, hard to land on one thing.',
      practice: 'Bilateral movement -- walking, or tapping alternately on each knee -- helps settle a racing mind faster than thinking your way out.',
    },
  },
  Venus: {
    intensifying: {
      theme: 'Your need for connection, comfort, or beauty is turned up today.',
      practice: 'Give yourself actual physical warmth -- a hand on your own arm, a warm drink, a soft layer. Let it count.',
    },
    harmonious: {
      theme: 'Relating to others and enjoying things come easily right now.',
      practice: 'Let a pleasant sensation last a few extra seconds before moving on -- that lingering is what helps it actually land in the body.',
    },
    challenging: {
      theme: 'Friction around worth or closeness may be more tender today.',
      practice: 'Hand on heart, one slow breath, and a short phrase that\'s true and kind -- something like "this is hard, and I\'m still okay."',
    },
  },
  Sun: {
    intensifying: {
      theme: 'Something about who you are or what you want is in the spotlight today.',
      practice: 'Stand for a moment and feel your own outline -- feet on the floor, the edges of your body. Let that be enough before you perform anything.',
    },
    harmonious: {
      theme: 'Your energy and sense of self feel unusually well-supported today.',
      practice: 'Move in a way that feels expressive, not just functional -- even thirty seconds of it.',
    },
    challenging: {
      theme: 'You may feel some friction between what you want and what\'s in front of you.',
      practice: 'Plant both feet, slow the exhale, and let your shoulders drop before you decide anything.',
    },
  },
  Mars: {
    intensifying: {
      theme: 'Activation is closer to the surface -- more fight-or-flight charge than usual.',
      practice: 'Discharge it physically first -- fast walking, shaking out your hands, pushing against a wall -- then decide anything. Don\'t skip the discharge step.',
    },
    harmonious: {
      theme: 'You have real drive available today, and it has somewhere constructive to go.',
      practice: 'Channel it into one purposeful physical task rather than letting it scatter.',
    },
    challenging: {
      theme: 'Irritability or friction may show up faster than you intend.',
      practice: 'Before you respond to anything annoying, get the charge out of your body first -- even a hard minute of movement changes what you say next.',
    },
  },
  Jupiter: {
    intensifying: {
      theme: 'Everything may feel bigger, more possible, more "yes" than usual.',
      practice: 'Check in with how much is actually landing versus how much is just momentum. Pace yourself on purpose.',
    },
    harmonious: {
      theme: 'Growth and good feeling have room to actually register today.',
      practice: 'Let yourself savor it rather than immediately reaching for the next thing.',
    },
    challenging: {
      theme: 'There may be more coming at you than your system can metabolize at once.',
      practice: 'Shrink your field on purpose -- pick one thing to actually attend to, let the rest wait.',
    },
  },
  Saturn: {
    intensifying: {
      theme: 'Things may feel heavier or more contracted -- structure pressing in.',
      practice: 'Pick one small, completely doable step. Small and real beats big and abandoned.',
    },
    harmonious: {
      theme: 'A steady, contained feeling is available today -- use it.',
      practice: 'Build one small ritual or routine while the stability is here to support it.',
    },
    challenging: {
      theme: 'Restriction or pressure may make things feel like "not enough."',
      practice: 'Titrate -- break whatever feels heavy into a piece small enough that it doesn\'t trigger collapse or shutdown.',
    },
  },
  Uranus: {
    intensifying: {
      theme: 'Your nervous system may be primed for the unexpected -- more alert, more startle-ready.',
      practice: 'Orient on purpose: look around the room, name five things you can see. It tells your system the present moment is actually safe.',
    },
    harmonious: {
      theme: 'A welcome jolt of aliveness or change is available today.',
      practice: 'Let the novelty move through your body -- shake it out, dance, don\'t just think about it.',
    },
    challenging: {
      theme: 'Sudden shifts may land as shock in the body before the mind catches up.',
      practice: 'Slow, repetitive motion -- rocking, walking a steady pace -- counters a startle spike better than trying to think your way calm.',
    },
  },
  Neptune: {
    intensifying: {
      theme: 'The edges of things -- including your own boundaries -- may feel softer or less defined.',
      practice: 'Give yourself a physical boundary cue -- a weighted blanket, arms wrapped around yourself, pressure on your own shoulders -- to feel your own outline again.',
    },
    harmonious: {
      theme: 'A soft, receptive state is available today.',
      practice: 'Let yourself actually rest in it -- with support, not just spacing out. A few minutes lying down, eyes closed, counts.',
    },
    challenging: {
      theme: 'Fogginess or a spaced-out, hard-to-locate-yourself feeling may show up.',
      practice: 'Strong sensory anchors -- cold water on your hands, a textured object, a strong smell -- bring you back into your body fastest.',
    },
  },
  Pluto: {
    intensifying: {
      theme: 'Something deep-system may be activated -- intensity that feels bigger than the day\'s events explain.',
      practice: 'Go slow on purpose. This isn\'t a day to process alone if it\'s a lot -- a steady person nearby helps regulate the charge.',
    },
    harmonious: {
      theme: 'Transformative energy has somewhere real to go today.',
      practice: 'Let the intensity move through in a contained way -- slow, deliberate movement rather than a sudden release.',
    },
    challenging: {
      theme: 'Power, control, or high-stakes dynamics may feel unusually charged.',
      practice: 'Prioritize felt safety before insight -- ground first, understand later. The meaning-making can wait for a calmer nervous system.',
    },
  },
}

export function getSomaticGuidance(hit: TransitHit): SomaticGuidance {
  const planet = hit.transitingPlanet as PlanetKey
  return GUIDANCE[planet][hit.nature]
}

