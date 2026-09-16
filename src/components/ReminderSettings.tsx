import { useEffect, useState } from 'react'
import {
  NO_REMINDERS,
  failureReason,
  isPushConfigured,
  isPushSupported,
  loadReminders,
  needsIosInstall,
  sendTestReminder,
  updateReminders,
  type PushFailure,
  type ReminderSettings as Settings,
} from '../lib/push'

/**
 * Opt-in for the daily check-in push reminders.
 *
 * Sits on the Journal page rather than the Forecast page on purpose: someone
 * looking at their streak is already thinking about keeping the habit going,
 * which is the moment a reminder offer is welcome rather than an interruption.
 */

const FAILURE_COPY: Record<PushFailure, string> = {
  unsupported: 'This browser can’t do reminders. Try Chrome on Android, or install LunaAura to your home screen on iPhone.',
  denied:
    'Notifications are blocked for this site. You can turn them back on in your browser’s site settings, then try again.',
  'no-token': 'Couldn’t register this device for notifications — try again in a moment.',
  'save-failed': 'Couldn’t save that just now — try again in a moment.',
}

// Matches the two cron entries in vercel.json.
const SEND_TIMES: Record<keyof Settings, string> = {
  morning: 'around 8am Eastern',
  evening: 'around 8pm Eastern',
}

export default function ReminderSettings() {
  const [settings, setSettings] = useState<Settings>(NO_REMINDERS)
  const [loading, setLoading] = useState<boolean>(true)
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const available = isPushConfigured() && isPushSupported()

  useEffect(() => {
    if (!available) {
      setLoading(false)
      return
    }
    loadReminders()
      .then(setSettings)
      .catch(() => setSettings(NO_REMINDERS))
      .finally(() => setLoading(false))
  }, [available])

  // Nothing to offer until the Web Push key is configured, or on a browser
  // that cannot receive push at all — better a clean page than a dead switch.
  if (!isPushConfigured()) return null

  async function toggle(period: keyof Settings) {
    // Written out rather than a computed key so the object stays exactly the
    // Settings shape for the type checker.
    const next: Settings =
      period === 'morning'
        ? { morning: !settings.morning, evening: settings.evening }
        : { morning: settings.morning, evening: !settings.evening }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await updateReminders(next)
      setSettings(next)
    } catch (err) {
      console.error(err)
      setError(FAILURE_COPY[failureReason(err)])
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await sendTestReminder()
      setNotice('Sent — it should appear in a few seconds.')
    } catch (err) {
      console.error(err)
      setError('Couldn’t send that test — try turning reminders off and on again.')
    } finally {
      setBusy(false)
    }
  }

  const anyOn = settings.morning || settings.evening

  return (
    <div className="glow-card rounded-2xl p-5 mb-8">
      <p className="text-xs uppercase tracking-wide text-[#8e85a8] mb-1">Reminders</p>
      <p className="text-sm text-[#dcd6ec] mb-4">
        A gentle nudge to check in. No streak guilt — turn them off any time.
      </p>

      {!isPushSupported() ? (
        <p className="text-sm text-[#9a92b3]">
          This browser can’t receive reminders. Chrome on Android works, and on iPhone you’ll need to
          add LunaAura to your home screen first.
        </p>
      ) : (
        <>
          {needsIosInstall() && (
            <p className="text-xs text-[#b6acd1] bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3 leading-relaxed">
              On iPhone, reminders only work once LunaAura is on your home screen: tap Share, then
              <span className="text-[#e9d9ff]"> Add to Home Screen</span>, and open it from there.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {(['morning', 'evening'] as (keyof Settings)[]).map((period) => (
              <button
                key={period}
                type="button"
                disabled={busy || loading}
                onClick={() => toggle(period)}
                aria-pressed={settings[period]}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-50 ${
                  settings[period]
                    ? 'bg-[#caa6ff]/20 border-[#caa6ff]/60 text-[#f1e8ff]'
                    : 'border-white/15 text-[#c9c2dd] hover:bg-white/5'
                }`}
              >
                {settings[period] ? '✓ ' : ''}
                {period === 'morning' ? 'Morning' : 'Evening'}
                <span className="text-[#8e85a8]"> · {SEND_TIMES[period]}</span>
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-[#ffb4b4] mb-2 leading-relaxed">{error}</p>}
          {notice && <p className="text-xs text-[#a9e6c8] mb-2">{notice}</p>}

          {anyOn && (
            <button
              type="button"
              disabled={busy}
              onClick={handleTest}
              className="text-xs text-[#8e85a8] underline decoration-[#caa6ff]/40 hover:text-[#c9c2dd] disabled:opacity-50"
            >
              Send me one now to check it works
            </button>
          )}
        </>
      )}
    </div>
  )
}
