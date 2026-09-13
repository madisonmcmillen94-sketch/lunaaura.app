import type { JournalEntry } from './journal'
import type { AspectNature } from './transits'

export interface MoodTally {
  word: string
  count: number
  pct: number // 0..1, share of entries in this window
}

export interface OverallMoodStats {
  total: number
  tallies: MoodTally[] // sorted, most frequent first
}

/** Simple frequency count of mood words across every journal entry, most-frequent first. */
export function overallMoodStats(entries: JournalEntry[]): OverallMoodStats {
  const counts = new Map<string, number>()
  for (const e of entries) {
    counts.set(e.moodWord, (counts.get(e.moodWord) ?? 0) + 1)
  }
  const total = entries.length
  const tallies = [...counts.entries()]
    .map(([word, count]) => ({ word, count, pct: total ? count / total : 0 }))
    .sort((a, b) => b.count - a.count)
  return { total, tallies }
}

export interface TransitMoodPattern {
  planet: string
  nature: AspectNature
  totalEntries: number // how many logged entries had this planet/nature active
  topMood: MoodTally
}

const MIN_SAMPLE = 3 // don't surface a "pattern" from 1-2 data points

/**
 * For each (transiting planet, aspect nature) combination the user has ever
 * logged a check-in under, find which mood word came up most often. This is
 * a pure aggregation over data the user already generated -- no AI, no
 * re-running astronomy, cheap enough to run client-side on every load.
 */
export function findTransitMoodPatterns(entries: JournalEntry[]): TransitMoodPattern[] {
  // key: "Planet|nature" -> moodWord -> count
  const groups = new Map<string, { planet: string; nature: AspectNature; moods: Map<string, number>; total: number }>()

  for (const entry of entries) {
    if (!entry.transitSnapshot || entry.transitSnapshot.length === 0) continue

    // Dedupe within one entry so a single check-in doesn't double-count a
    // planet/nature pair that hit more than one natal point at once.
    const seenThisEntry = new Set<string>()
    for (const hit of entry.transitSnapshot) {
      const key = `${hit.transitingPlanet}|${hit.nature}`
      if (seenThisEntry.has(key)) continue
      seenThisEntry.add(key)

      if (!groups.has(key)) {
        groups.set(key, { planet: hit.transitingPlanet, nature: hit.nature, moods: new Map(), total: 0 })
      }
      const g = groups.get(key)!
      g.total += 1
      g.moods.set(entry.moodWord, (g.moods.get(entry.moodWord) ?? 0) + 1)
    }
  }

  const patterns: TransitMoodPattern[] = []
  for (const g of groups.values()) {
    if (g.total < MIN_SAMPLE) continue
    let topWord = ''
    let topCount = 0
    for (const [word, count] of g.moods) {
      if (count > topCount) {
        topWord = word
        topCount = count
      }
    }
    patterns.push({
      planet: g.planet,
      nature: g.nature,
      totalEntries: g.total,
      topMood: { word: topWord, count: topCount, pct: topCount / g.total },
    })
  }

  // Most pronounced (highest share) first; ties broken by larger sample size.
  return patterns.sort((a, b) => b.topMood.pct - a.topMood.pct || b.totalEntries - a.totalEntries)
}
