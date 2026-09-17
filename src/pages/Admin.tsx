import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminLookup, adminResetChart, adminSetTier, adminStats, type AdminLookupResult, type AdminStats } from '../lib/adminApi'

const TIER_OPTIONS = ['free', 'plus', 'all_access'] as const

// Founder-only page: customer lookup, a "force fix" for a stuck chart, and a
// coarse usage snapshot. Client-side gating below is just UX (hide the page
// from everyone else) -- the real access control lives server-side in
// api/lib/adminAuth.ts, which checks the caller's Firebase ID token against
// ADMIN_UIDS. Set VITE_ADMIN_UID in Vercel to your own Firebase Auth uid so
// this page shows up for your account.

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-4 text-center">
      <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">{label}</p>
      <p className="text-2xl text-[#e9d9ff]">{value}</p>
    </div>
  )
}

function StatsPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setStats(await adminStats())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="glow-card rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display">App snapshot</h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-[#c9c2dd] hover:text-[#e9e4f5] underline decoration-[#caa6ff]/40 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="text-sm text-[#ffb4b4] mb-4">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <StatCard label="Accounts" value={stats.totalAccounts} />
            <StatCard label="Saved charts" value={stats.totalSavedCharts} />
            <StatCard label="Journal entries" value={stats.totalJournalEntries} />
            <StatCard label="All Access" value={stats.tierBreakdown.all_access} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Free" value={stats.tierBreakdown.free} />
            <StatCard label="Plus" value={stats.tierBreakdown.plus} />
            <StatCard label="Untagged" value={stats.tierBreakdown.untagged} />
          </div>
          <p className="text-xs text-[#8e85a8] mt-4">
            As of {new Date(stats.generatedAt).toLocaleString()}. "Untagged" is accounts with no{' '}
            <code>/users</code> profile document at all yet (a known gap in signup, not a bug in these numbers).
          </p>
        </>
      )}
    </section>
  )
}

function LookupPanel() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<AdminLookupResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [updatingTier, setUpdatingTier] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    setResult(null)
    try {
      setResult(await adminLookup(email.trim()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleForceFix() {
    if (!result) return
    setResetting(true)
    setError(null)
    setNotice(null)
    try {
      const fixed = await adminResetChart(result.uid)
      setNotice(`Recomputed: Sun ${fixed.sun} · Moon ${fixed.moon} · Rising ${fixed.rising}`)
      setResult({
        ...result,
        chart: result.chart ? { ...result.chart, sun: fixed.sun, moon: fixed.moon, rising: fixed.rising } : result.chart,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  async function handleSetTier(tier: (typeof TIER_OPTIONS)[number]) {
    if (!result || tier === result.profile.tier) return
    setUpdatingTier(true)
    setError(null)
    setNotice(null)
    try {
      const updated = await adminSetTier(result.uid, tier)
      setNotice(`Tier set to ${updated.tier}.`)
      setResult({ ...result, profile: { ...result.profile, tier: updated.tier } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tier update failed')
    } finally {
      setUpdatingTier(false)
    }
  }

  return (
    <section className="glow-card rounded-2xl p-6">
      <h2 className="text-lg font-display mb-4">Customer lookup</h2>
      <form onSubmit={handleLookup} className="flex gap-3 mb-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="visitor@example.com"
          className="flex-1 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-5 py-2 text-sm hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
        >
          {loading ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-[#c8f5d8] bg-[#123a1f]/40 border border-[#c8f5d8]/20 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}

      {result && (
        <div className="rounded-xl bg-black/20 border border-white/10 p-5 space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[#e9d9ff] text-lg">{result.email}</p>
            <span className="text-xs uppercase tracking-wide text-[#8e85a8]">{result.uid}</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[#8e85a8] text-xs uppercase mb-1">Tier</p>
              <div className="flex items-center gap-2">
                <select
                  value={result.profile.tier}
                  disabled={updatingTier}
                  onChange={(e) => handleSetTier(e.target.value as (typeof TIER_OPTIONS)[number])}
                  className="rounded-lg bg-black/30 border border-white/15 px-2 py-1 text-sm text-[#dcd6ec] outline-none focus:border-[#caa6ff]/60 disabled:opacity-60"
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {updatingTier && <span className="text-xs text-[#8e85a8]">Saving…</span>}
              </div>
            </div>
            <div>
              <p className="text-[#8e85a8] text-xs uppercase mb-1">Created</p>
              <p className="text-[#dcd6ec]">
                {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-[#8e85a8] text-xs uppercase mb-1">Journal entries</p>
              <p className="text-[#dcd6ec]">{result.journalEntryCount}</p>
            </div>
          </div>

          {result.profile.note && (
            <p className="text-xs text-[#e9c46a]">{result.profile.note}</p>
          )}

          <div>
            <p className="text-[#8e85a8] text-xs uppercase mb-2">Saved chart</p>
            {result.chart ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-[#dcd6ec]">
                  Sun {result.chart.sun} · Moon {result.chart.moon} · Rising {result.chart.rising}
                </span>
                <span className="text-xs text-[#8e85a8]">
                  ({result.chart.birthPlace}, {result.chart.birthDate} {result.chart.birthTime})
                </span>
                <button
                  onClick={handleForceFix}
                  disabled={resetting}
                  className="ml-auto rounded-full border border-[#caa6ff]/50 text-[#e9d9ff] text-xs px-4 py-1.5 hover:bg-[#caa6ff]/10 transition-colors disabled:opacity-60"
                >
                  {resetting ? 'Recomputing…' : 'Force recompute chart'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#8e85a8]">No saved chart for this account.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default function Admin() {
  const { user, loading } = useAuth()

  if (loading) return null

  const isAdmin = !!ADMIN_UID && user?.uid === ADMIN_UID

  if (!isAdmin) {
    // Deliberately generic -- don't confirm to a non-admin visitor that an
    // admin page exists at all beyond "this isn't for you."
    return (
      <div className="max-w-2xl mx-auto px-5 py-12">
        <p className="text-[#c9c2dd]">Nothing here.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-8">Admin</h1>
      <StatsPanel />
      <LookupPanel />
    </div>
  )
}
