export interface Article {
  slug: string
  title: string
  dek: string
  body: string[] // paragraphs
}

export const articles: Article[] = [
  {
    slug: 'moon-phases-and-the-body',
    title: 'What the Moon Actually Does (and What We Add to It)',
    dek: 'The real astronomy behind lunar phases, and how diaspora traditions have long read the sky as part of the body.',
    body: [
      'The Moon’s phase is simple physics: it’s the changing angle between the Sun, Earth, and Moon as the Moon orbits us roughly every 29.5 days. That part is settled science, not belief — anyone, anywhere, sees the same phase on the same night.',
      'What’s not settled science is whether the Moon measurably affects human mood, sleep, or the nervous system. Some small studies suggest a modest link to sleep timing around the Full Moon; many others find nothing. Be wary of anyone — including this app — who tells you the research is more conclusive than it is.',
      'What is real, and worth taking seriously on its own terms, is that for a very long time and across many diaspora traditions, the lunar cycle has been used as a structure for rest, ritual, and self-reflection — a shared rhythm to plan around, independent of whether a controlled study can detect it in blood work. LunaAura treats the Moon’s phase the way many lineages have: as a scaffold for noticing yourself, not as a medical variable.',
      'The practical version: use the New Moon to rest and set intention, the Full Moon to notice what’s activated, and the weeks between to act and release. Then check that structure against your own journal — your own data is more useful to you than any general claim about “the Moon.”',
    ],
  },
  {
    slug: 'planetary-retrogrades-explained',
    title: 'Retrogrades, Plainly',
    dek: 'What "Mercury retrograde" actually refers to, astronomically, and how to use retrograde seasons without the fear-mongering.',
    body: [
      'A planet appears to move “backward” against the stars when Earth, on its own orbit, passes it (for outer planets) or when it passes Earth (for inner planets like Mercury). It’s an optical effect of relative motion — the planet itself hasn’t changed direction. This is real, observable, and predictable well in advance.',
      'The idea that retrogrades cause communication breakdowns or technology failures is a cultural interpretation layered on top of that astronomy, not a mechanism anyone has demonstrated. It’s fair to enjoy the symbolism without needing it to be literally causal.',
      'Where it’s genuinely useful: retrograde seasons are a built-in, calendar-based prompt to slow down, double-check details, and revisit unfinished business — good practice at any time, made easier to remember because there’s a date range attached to it.',
    ],
  },
  {
    slug: 'earth-activity-and-nervous-system',
    title: 'Earthquakes, Geomagnetic Storms, and Your Body: What We Know and Don’t',
    dek: 'LunaAura pulls real seismic and geomagnetic data. Here’s exactly how seriously to take it.',
    body: [
      'Earthquakes and geomagnetic storms (disturbances in Earth’s magnetic field, usually from solar activity) are both real, well-measured phenomena — LunaAura pulls live numbers from the USGS and NOAA’s Space Weather Prediction Center, the same agencies scientists and pilots rely on.',
      'Whether these events affect human nervous systems is genuinely debated. Geomagnetic activity has some peer-reviewed association with sleep and cardiovascular measures in a handful of studies, though effect sizes are small and results are mixed. A causal link between a distant earthquake and how you personally feel that day has essentially no rigorous evidence behind it.',
      'LunaAura still surfaces this data, for two honest reasons: first, some people do notice a pattern in their own logs over time, and their own journal is the only dataset that actually applies to them. Second, simply knowing “there’s a lot going on with the Earth right now” can be grounding on its own — a reminder that a hard day isn’t only about you.',
      'Use this data as a prompt for curiosity, not as an explanation that lets you skip paying attention to what’s actually going on in your life, sleep, and stress load.',
    ],
  },
  {
    slug: 'building-a-personal-practice',
    title: 'Turning This Into an Actual Practice',
    dek: 'How to use the Forecast and Journal together without turning it into another thing to obsess over.',
    body: [
      'The Forecast page is meant to be read once a day, in under a minute. If checking it starts to feel compulsive, that’s worth noticing — the goal is a lighter relationship with your own rhythms, not a new source of anxiety.',
      'The Journal is where the real insight lives. After a few weeks of quick check-ins, look back and see what actually correlates for you: maybe your Full Moons are unremarkable but your Last Quarters are consistently rough. That’s more useful than any general claim, because it’s your pattern, not a borrowed one.',
      'If you want to go deeper — structured somatic practices, nervous-system regulation tools, and a guided daily rhythm rooted in Yoruba cosmology — that’s exactly what Ori Codes was built for. LunaAura is the observation deck; Ori Codes is the practice room.',
    ],
  },
]

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug)
}
