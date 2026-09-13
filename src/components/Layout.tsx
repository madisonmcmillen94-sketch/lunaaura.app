import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../lib/auth'
import { TIER_LABEL } from '../lib/tiers'

const navItem =
  'px-3 py-2 text-sm tracking-wide rounded-full transition-colors'

function AuthNav() {
  const { user, isAccount, tier, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  if (isAccount && user) {
    return (
      <div className="flex items-center gap-3 pl-3 ml-2 border-l border-white/10">
        <span className="hidden sm:inline text-xs text-[#8e85a8] max-w-[10rem] truncate">
          {user.email}
        </span>
        <NavLink
          to="/pricing"
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
            navigate('/')
          }}
          className="text-xs text-[#c9c2dd] hover:text-[#e9e4f5] underline decoration-[#8e85a8]/50"
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 pl-3 ml-2 border-l border-white/10">
      <NavLink
        to="/login"
        className={({ isActive }) =>
          `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
        }
      >
        Log in
      </NavLink>
      <NavLink
        to="/signup"
        className={({ isActive }) =>
          `${navItem} ${isActive ? 'bg-[#caa6ff] text-[#1a0f2e] font-semibold' : 'bg-white/10 text-[#e9e4f5] hover:bg-white/15'}`
        }
      >
        Sign up
      </NavLink>
    </div>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0a1f] text-[#e9e4f5]">
      <header className="sticky top-0 z-20 backdrop-blur bg-[#0b0a1f]/80 border-b border-white/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
          <NavLink to="/" className="flex items-center gap-2 font-display text-xl">
            <span aria-hidden>🌙</span>
            <span>LunaAura</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Forecast
            </NavLink>
            <NavLink
              to="/journal"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Journal
            </NavLink>
            <NavLink
              to="/chart"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Chart
            </NavLink>
            <NavLink
              to="/patterns"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Patterns
            </NavLink>
            <NavLink
              to="/learn"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Learn
            </NavLink>
            <AuthNav />
          </nav>
        </div>
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
