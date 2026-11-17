import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { articles } from '../lib/articles'
import { setPageMeta } from '../lib/pageMeta'
import { useAuth } from '../context/AuthContext'
import UpgradeGate from '../components/UpgradeGate'

export default function Learn() {
  const { user, isAccount } = useAuth()
  const [downloading, setDownloading] = useState(false)
  const [denied, setDenied] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    return setPageMeta({
      title: 'Learn — Moon Phases, Retrogrades & Earth Activity Explained | LunaAura',
      description:
        'Plain-language explainers on the astronomy and earth science behind LunaAura -- what’s established, what’s intuitive interpretation, and how to tell the difference.',
    })
  }, [])

  async function handleDeepeningDownload() {
    if (!user || downloading) return
    setDownloading(true)
    setDenied(false)
    setDownloadError(null)
    try {
      const idToken = await user.getIdToken()
      const res = await fetch('/api/download-deepening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (res.status === 403) {
        // The server says this account does not have All Access — show the
        // same upgrade prompt the app uses for gated features.
        setDenied(true)
        return
      }
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'The-Deepening-LunaAura.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('The workbook could not be downloaded right now — please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-3xl font-display mb-2">Learn</h1>
      <p className="text-[#c9c2dd] mb-10">
        Plain-language explainers on the astronomy and earth science behind LunaAura —
        what’s established, what’s intuitive interpretation, and how to tell the difference.
      </p>

      <h2 className="text-2xl font-display mb-4">Workbooks</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <div className="glow-card rounded-2xl p-6">
          <h3 className="text-xl font-display mb-1">7-Day Nervous System Reset Guide</h3>
          <p className="text-[#b6acd1] text-sm mb-4">
            A gentle, seven-day invitation to notice — short practices to come back to your body, one day at a time.
          </p>
          {isAccount ? (
            <a
              href="/7-day-nervous-system-reset-guide.pdf"
              download
              className="inline-block rounded-full bg-[#d9b36a] text-[#1a0f2e] font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              Download the free guide
            </a>
          ) : (
            <Link
              to="/login"
              className="inline-block rounded-full bg-[#d9b36a] text-[#1a0f2e] font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity"
            >
              Sign in to download the free guide
            </Link>
          )}
        </div>

        <div className="glow-card rounded-2xl p-6">
          <h3 className="text-xl font-display mb-1">The Deepening — All Access Workbook</h3>
          <p className="text-[#b6acd1] text-sm mb-4">
            The companion workbook for All Access members — go deeper with the practices from the guide.
          </p>
          {denied ? (
            <div className="glow-card rounded-2xl p-6 border-dashed border-2 border-[#caa6ff]/25 text-center">
              <p className="text-sm uppercase tracking-wide text-[#b6acd1] mb-2">All Access feature</p>
              <p className="text-[#dcd6ec] mb-4">The Deepening workbook is part of All Access.</p>
              <Link
                to="/pricing"
                className="inline-block rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors"
              >
                Upgrade to All Access
              </Link>
            </div>
          ) : (
            <UpgradeGate required="all_access" teaser="The Deepening workbook is part of All Access.">
              <button
                type="button"
                onClick={handleDeepeningDownload}
                disabled={downloading}
                className="inline-block rounded-full bg-[#d9b36a] text-[#1a0f2e] font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {downloading ? 'Preparing your download…' : 'Download the workbook'}
              </button>
            </UpgradeGate>
          )}
          {downloadError && <p className="text-[#f0a8a8] text-sm mt-3">{downloadError}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {articles.map((a) => (
          <Link
            key={a.slug}
            to={`/learn/${a.slug}`}
            className="block glow-card rounded-2xl p-6 hover:border-[#caa6ff]/40 transition-colors"
          >
            <h2 className="text-xl font-display mb-1">{a.title}</h2>
            <p className="text-[#b6acd1] text-sm">{a.dek}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
