import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpWithEmail } from '../lib/auth'
import { saveBirthInput } from '../lib/natalStorage'
import type { BirthInput } from '../lib/natal'
import PlaceSearch from '../components/PlaceSearch'

const UTC_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12).map((h) => ({
  value: h * 60,
  label: h === 0 ? 'UTC+0' : `UTC${h > 0 ? '+' : ''}${h}`,
}))

function emptyInput(): BirthInput {
  // Default to wherever they are now rather than a hard-coded US offset -- for
  // most people their birth offset is the same or one hour off, which is a far
  // better starting guess than someone else's timezone.
  return {
    date: '',
    time: '',
    utcOffsetMinutes: new Date().getTimezoneOffset(),
    latitude: NaN,
    longitude: NaN,
    placeLabel: '',
  }
}

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<BirthInput>(emptyInput())

  async function handleCreateAccount() {
    setError(null)
    if (!email || !password) {
      setError('Enter an email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSubmitting(true)
    try {
      await signUpWithEmail(email, password)
      setStep(2)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('That email already has an account — try logging in instead.')
      } else if (code === 'auth/invalid-email') {
        setError("That email address doesn't look right.")
      } else if (code === 'auth/weak-password') {
        setError('Please choose a stronger password.')
      } else {
        console.error(e)
        setError('Could not create your account — try again in a moment.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveChart() {
    setError(null)
    if (!form.date || !form.time || Number.isNaN(form.latitude) || Number.isNaN(form.longitude)) {
      setError('Date, time, latitude, and longitude are all needed for an accurate chart.')
      return
    }
    setSubmitting(true)
    try {
      await saveBirthInput(form)
      navigate('/chart')
    } catch (e) {
      console.error(e)
      setError("Couldn't save your chart — you can add it later from the Chart tab.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-3xl font-display mb-2 text-center">
        {step === 1 ? 'Create your account' : 'Your birth details'}
      </h1>
      <p className="text-[#c9c2dd] text-center mb-8">
        {step === 1
          ? 'Your chart, your journal and your patterns — private to you, synced across your devices.'
          : "Enter these once for an accurate chart. If you don't know your birth time, use your best estimate."}
      </p>

      {error && (
        <p className="mb-4 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {step === 1 ? (
        <div className="glow-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#b6acd1] mb-2">Email</label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              inputMode="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAccount()
              }}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
            />
          </div>
          <div>
            <label className="block text-sm text-[#b6acd1] mb-2">Password</label>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAccount()
              }}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
            />
            <p className="text-xs text-[#8e85a8] mt-1">At least 6 characters.</p>
          </div>
          <div>
            <label className="block text-sm text-[#b6acd1] mb-2">Confirm password</label>
            <input
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateAccount()
              }}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
            />
          </div>
          <button
            onClick={handleCreateAccount}
            disabled={submitting}
            className="w-full rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Continue'}
          </button>
          <p className="text-xs text-[#8e85a8] text-center">
            Already have an account?{' '}
            <Link to="/login" className="underline decoration-[#caa6ff]/50">
              Log in
            </Link>
          </p>
        </div>
      ) : (
        <div className="glow-card rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Birth date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Birth time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#b6acd1] mb-2">UTC offset at time of birth</label>
            <select
              value={form.utcOffsetMinutes}
              onChange={(e) => setForm((f) => ({ ...f, utcOffsetMinutes: Number(e.target.value) }))}
              className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
            >
              {UTC_OFFSETS.map((o) => (
                <option key={o.value} value={-o.value} className="bg-[#1a0f2e]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <PlaceSearch
            onPick={(place) =>
              setForm((f) => ({
                ...f,
                placeLabel: place.label,
                latitude: place.latitude,
                longitude: place.longitude,
              }))
            }
          />

          {form.placeLabel && Number.isFinite(form.latitude) && (
            <p className="text-xs text-[#a9e6c8]">
              ✓ Using {form.placeLabel}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={Number.isNaN(form.latitude) ? '' : form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) }))}
                placeholder="e.g. 29.4841"
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b6acd1] mb-2">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={Number.isNaN(form.longitude) ? '' : form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) }))}
                placeholder="e.g. -82.8593 (west negative)"
                className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] placeholder:text-[#6b6280] outline-none focus:border-[#caa6ff]/60"
              />
            </div>
          </div>
          <p className="text-xs text-[#8e85a8]">
            These fill in automatically when you pick a place above — you only need to touch them
            if you want to fine-tune the exact spot.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSaveChart}
              disabled={submitting}
              className="flex-1 rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save my chart'}
            </button>
            <button
              onClick={() => navigate('/chart')}
              className="rounded-full border border-white/15 text-[#c9c2dd] px-6 py-2.5 hover:bg-white/5 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
