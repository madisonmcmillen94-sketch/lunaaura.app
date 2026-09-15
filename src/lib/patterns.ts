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

export interface MoonPhaseMoodPattern {
  moonPhase: string
  totalEntries: number // how many logged entries fell during this moon phase
  topMood: MoodTally
}

/**
 * Same idea as findTransitMoodPatterns, but grouped by moon phase instead of
 * transit. Every entry already has a moonPhase (no saved chart required), so
 * this works for anyone who's logged a handful of check-ins -- unlike the
 * transit patterns above, which need a saved natal chart on file.
 */
export function findMoonPhaseMoodPatterns(entries: JournalEntry[]): MoonPhaseMoodPattern[] {
  const groups = new Map<string, { moods: Map<string, number>; total: number }>()

  for (const entry of entries) {
    if (!entry.moonPhase) continue
    if (!groups.has(entry.moonPhase)) {
      groups.set(entry.moonPhase, { moods: new Map(), total: 0 })
    }
    const g = groups.get(entry.moonPhase)!
    g.total += 1
    g.moods.set(entry.moodWord, (g.moods.get(entry.moodWord) ?? 0) + 1)
  }

  const patterns: MoonPhaseMoodPattern[] = []
  for (const [moonPhase, g] of groups) {
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
      moonPhase,
      totalEntries: g.total,
      topMood: { word: topWord, count: topCount, pct: topCount / g.total },
    })
  }

  return patterns.sort((a, b) => b.topMood.pct - a.topMood.pct || b.totalEntries - a.totalEntries)
}

export interface StreakStats {
  currentStreak: number // consecutive logged days ending today or yesterday (0 if the trail is broken)
  longestStreak: number
  totalEntries: number
  firstEntryDate: string | null // ISO date (YYYY-MM-DD) of the earliest check-in
  daysSinceFirstEntry: number
}

const DAY_MS = 86400000

function isoDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * Turns raw entries into the "journey" numbers shown on the free Journal
 * page: how many days in a row, the best run ever, how long they've been at
 * this, and the total count. One entry per date is enough to keep a streak
 * alive even if someone logs twice in one day.
 */
export function computeStreakStats(entries: JournalEntry[]): StreakStats {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalEntries: 0, firstEntryDate: null, daysSinceFirstEntry: 0 }
  }

  const uniqueDates = [...new Set(entries.map((e) => e.date))].sort()

  let longestStreak = 1
  let run = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(`${uniqueDates[i - 1]}T00:00:00Z`).getTime()
    const curr = new Date(`${uniqueDates[i]}T00:00:00Z`).getTime()
    run = curr - prev === DAY_MS ? run + 1 : 1
    if (run > longestStreak) longestStreak = run
  }

  const dateSet = new Set(uniqueDates)
  const today = isoDateNDaysAgo(0)
  const yesterday = isoDateNDaysAgo(1)
  let currentStreak = 0
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    let cursorDays = dateSet.has(today) ? 0 : 1
    while (dateSet.has(isoDateNDaysAgo(cursorDays))) {
      currentStreak += 1
      cursorDays += 1
    }
  }

  const firstEntryDate = uniqueDates[0]
  const daysSinceFirstEntry = Math.floor((Date.now() - new Date(`${firstEntryDate}T00:00:00Z`).getTime()) / DAY_MS)

  return { currentStreak, longestStreak, totalEntries: entries.length, firstEntryDate, daysSinceFirstEntry }
}

export const MILESTONE_THRESHOLDS = [7, 30, 100, 365] as const

export interface Milestone {
  threshold: number
  label: string
  achieved: boolean
}

/** Simple total-check-ins milestones, in ascending order. */
export function computeMilestones(entries: JournalEntry[]): Milestone[] {
  const total = entries.length
  return MILESTONE_THRESHOLDS.map((threshold) => ({
    threshold,
    label: `${threshold} check-ins`,
    achieved: total >= threshold,
  }))
}
