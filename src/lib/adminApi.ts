import { auth } from './firebase'

// Thin client for the /api/admin/* endpoints. Every call attaches the
// signed-in visitor's Firebase ID token; the server is what actually decides
// whether that token belongs to an admin (see api/lib/adminAuth.ts). This
// file has no access-control logic of its own on purpose.

async function authedFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const idToken = await user.getIdToken()

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${idToken}`,
    },
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`)
  }
  return data
}

export interface AdminLookupResult {
  uid: string
  email: string | null
  createdAt: string | null
  lastSignedInAt: string | null
  disabled: boolean
  profile: {
    tier: 'free' | 'plus' | 'all_access'
    stripeCustomerId: string | null
    onboardedAt: string | null
    note?: string
  }
  chart: {
    sun: string | null
    moon: string | null
    rising: string | null
    birthPlace: string | null
    birthDate: string | null
    birthTime: string | null
  } | null
  journalEntryCount: number
}

export function adminLookup(email: string): Promise<AdminLookupResult> {
  return authedFetch(`/api/admin/lookup?email=${encodeURIComponent(email)}`)
}

export interface AdminResetChartResult {
  ok: true
  sun: string
  moon: string
  rising: string
}

export function adminResetChart(uid: string): Promise<AdminResetChartResult> {
  return authedFetch('/api/admin/reset-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid }),
  })
}

export interface AdminSetTierResult {
  ok: true
  uid: string
  tier: 'free' | 'plus' | 'all_access'
}

export function adminSetTier(uid: string, tier: 'free' | 'plus' | 'all_access'): Promise<AdminSetTierResult> {
  return authedFetch('/api/admin/set-tier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, tier }),
  })
}

export interface AdminStats {
  totalAccounts: number
  tierBreakdown: { free: number; plus: number; all_access: number; untagged: number }
  totalSavedCharts: number
  totalJournalEntries: number
  generatedAt: string
}

export function adminStats(): Promise<AdminStats> {
  return authedFetch('/api/admin/stats')
}
