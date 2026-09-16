import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Gate for pages that need a real account.
 *
 * `isAccount` is false for both signed-out visitors and anonymous sessions, so
 * someone who journalled anonymously before this gate existed is sent to sign
 * up rather than silently locked out of their own entries -- signing up runs
 * linkWithCredential, which upgrades that same anonymous uid in place and
 * keeps everything they already wrote.
 */
export default function RequireAccount({ children }: { children: ReactNode }) {
  const { isAccount, loading } = useAuth()
  const location = useLocation()

  // Auth state resolves asynchronously on every load. Redirecting during that
  // window would bounce signed-in people to the login page on every refresh.
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-24 text-center">
        <p className="text-sm text-[#8e85a8]">One moment…</p>
      </div>
    )
  }

  if (!isAccount) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
