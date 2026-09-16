import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../lib/auth'
import { TIER_LABEL } from '../lib/tiers'

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID as string | undefined

const navItem =
  'px-3 py-2 text-sm tracking-wide rounded-full transition-colors'

const mobileNavItem =
  'block w-full px-4 py-3 text-base rounded-xl transition-colors'

const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Forecast', end: true },
  { to: '/journal', label: 'Journal' },
  { to: '/chart', label: 'Chart' },
  { to: '/synastry', label: 'Synastry' },
  { to: '/breathe', label: 'Breathe' },
  { to: '/companion', label: 'Ask' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/learn', label: 'Learn' },
]

function AuthNav({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const { user, isAccount, tier, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = variant === 'mobile'

  if (loading) return null

  if (isAccount && user) {
    return (
      <div
        className={
          isMobile
            ? 'flex flex-col gap-3'
            : 'flex items-center gap-3 pl-3 ml-2 border-l border-white/10'
        }
      >
        <span
          className={
            isMobile
              ? 'text-xs text-[#8e85a8] truncate'
              : 'hidden sm:inline text-xs text-[#8e85a8] max-w-[10rem] truncate'
          }
        >
          {user.email}
        </span>
        <div className={isMobile ? 'flex flex-wrap items-center gap-2' : 'flex items-center gap-3'}>
          {ADMIN_UID && user.uid === ADMIN_UID && (
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) =>
                `text-xs rounded-full px-2.5 py-1 border border-white/15 ${
                  isActive ? 'bg-white/10 text-[#e9e4f5]' : 'text-[#8e85a8] hover:text-[#e9e4f5]'
                }`
              }
            >
              Admin
            </NavLink>
          )}
          <NavLink
            to="/pricing"
            onClick={onNavigate}
            className={`text-xs rounded-full px-2.5 py-1 border ${
              tier === 'free'
                ? 'border-[#caa6ff]/40 text-[#e9d9ff] hover:bg-[#caa6ff]/10'
                : 'border-[#caa6ff]/60 bg-[#caa6ff]/15 text-[#f1e8ff]'
            }`}
          >
            {tier === 'free' ? 'Upgrade' : TIER_LABEL[tier]}
          </NavLink>
          <button
            onClick={async () => {
              await logOut()
              onNavigate?.()
              navigate('/')
            }}
            className="text-xs text-[#c9c2dd] hover:text-[#e9e4f5] underline decoration-[#8e85a8]/50"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        isMobile
          ? 'flex flex-col gap-2'
          : 'flex items-center gap-1 pl-3 ml-2 border-l border-white/10'
      }
    >
      <NavLink
        to="/login"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${isMobile ? mobileNavItem : navItem} ${
            isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'
          }`
        }
      >
        Log in
      </NavLink>
      <NavLink
        to="/signup"
        onClick={onNavigate}
        className={({ isActive }) =>
          `${isMobile ? mobileNavItem : navItem} ${
            isActive
              ? 'bg-[#caa6ff] text-[#1a0f2e] font-semibold'
              : 'bg-white/10 text-[#e9e4f5] hover:bg-white/15'
          }`
        }
      >
        Sign up
      </NavLink>
    </div>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0a1f] text-[#e9e4f5]">
      <header className="sticky top-0 z-20 backdrop-blur bg-[#0b0a1f]/80 border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
          <NavLink
            to="/"
            className="flex items-center gap-2 font-display text-xl"
            onClick={() => setMenuOpen(false)}
          >
            <span aria-hidden>🌙</span>
            <span>LunaAura</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `${navItem} ${
                    isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <AuthNav />
          </nav>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-[#e9e4f5] hover:bg-white/5 transition-colors"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile pop-out panel */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/10 bg-[#0b0a1f]/95 px-5 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `${mobileNavItem} ${
                    isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 mt-2 border-t border-white/10">
              <AuthNav variant="mobile" onNavigate={() => setMenuOpen(false)} />
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-5xl mx-auto px-5 py-8 text-sm text-[#9a92b3] flex flex-col sm:flex-row gap-3 sm:justify-between">
          <p>
            LunaAura is a spiritual and self-awareness practice tool, not a medical
            device. It doesn&rsquo;t diagnose or treat anything.
          </p>
          <p>
            Want a deeper daily practice?{' '}
            <a
              href="https://ori-codes-app.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#caa6ff]/50 hover:decoration-[#caa6ff]"
            >
              Try Ori Codes →
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
