import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/wanted', label: 'Se Busca', end: false },
  { to: '/news', label: 'News Coo', end: false },
  { to: '/sagas', label: 'Poneglyph', end: false },
]

export function AppLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-sky-950 bg-sky-900 text-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <span className="shrink-0 font-black tracking-tight">🧭 Log Pose</span>
          <nav aria-label="Principal" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${isActive ? 'bg-white text-sky-900' : 'text-sky-100 hover:bg-sky-800'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden text-right text-xs leading-tight md:block">
            <p className="font-semibold">{session?.team.name}</p>
            <p className="text-sky-200">{session?.team.code}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
            className="shrink-0 rounded-lg border border-sky-300/40 px-3 py-1.5 text-sm font-semibold hover:bg-sky-800"
          >
            Salir
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
