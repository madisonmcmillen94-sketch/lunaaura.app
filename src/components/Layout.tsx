import { NavLink, Outlet } from 'react-router-dom'

const navItem =
  'px-3 py-2 text-sm tracking-wide rounded-full transition-colors'

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
              to="/learn"
              className={({ isActive }) =>
                `${navItem} ${isActive ? 'bg-[#caa6ff]/15 text-[#e9d9ff]' : 'text-[#c9c2dd] hover:bg-white/5'}`
              }
            >
              Learn
            </NavLink>
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

