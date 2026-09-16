import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { logInWithEmail, resetPassword } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  // RequireAccount records the page someone was trying to reach before being
  // sent here, so logging in returns them to it instead of dumping everyone on
  // the chart page.
  const from = (location.state as { from?: string } | null)?.from
  const destination = from && from !== '/login' && from !== '/signup' ? from : '/chart'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogIn() {
    setError(null)
    setResetSent(false)
    if (!email || !password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    try {
      await logInWithEmail(email, password)
      navigate(destination)
    } catch (e) {
      const code = (e as { code?: string }).code
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Email or password is incorrect.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts — try again in a few minutes.')
      } else {
        console.error(e)
        setError('Could not log in — try again in a moment.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset() {
    setError(null)
    setResetSent(false)
    if (!email) {
      setError('Enter your email above first, then tap "Forgot password" again.')
      return
    }
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (e) {
      console.error(e)
      setError('Could not send a reset email — check the address and try again.')
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="text-3xl font-display mb-2 text-center">Log in</h1>
      <p className="text-[#c9c2dd] text-center mb-8">Welcome back.</p>

      {error && (
        <p className="mb-4 text-sm text-[#ffb4b4] bg-[#3a1a1a]/40 border border-[#ffb4b4]/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {resetSent && (
        <p className="mb-4 text-sm text-[#c9f5d9] bg-[#1a3a24]/40 border border-[#c9f5d9]/20 rounded-lg px-3 py-2">
          Password reset email sent — check your inbox.
        </p>
      )}

      <div className="glow-card rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
          />
        </div>
        <div>
          <label className="block text-sm text-[#b6acd1] mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogIn()
            }}
            className="w-full rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-sm text-[#e9e4f5] outline-none focus:border-[#caa6ff]/60"
          />
        </div>
        <button
          onClick={handleLogIn}
          disabled={submitting}
          className="w-full rounded-full bg-[#caa6ff] text-[#1a0f2e] font-semibold px-6 py-2.5 hover:bg-[#dcc0ff] transition-colors disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <div className="flex justify-between text-xs text-[#8e85a8]">
          <button onClick={handleReset} className="underline decoration-[#8e85a8]/50 hover:text-[#e9e4f5]">
            Forgot password?
          </button>
          <Link to="/signup" className="underline decoration-[#caa6ff]/50 hover:text-[#e9e4f5]">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
