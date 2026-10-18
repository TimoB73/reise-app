import { Link, Outlet, useLocation } from 'react-router-dom'
import OfflineBanner from './OfflineBanner'

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="safe-top sticky top-0 z-10 bg-brand-600 text-white shadow">
        <div className="flex h-14 items-center gap-2 px-4">
          {!isHome && (
            <Link to="/" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl active:bg-white/20" aria-label="Zurück">
              ‹
            </Link>
          )}
          <h1 className="flex-1 text-lg font-semibold">Reise-App</h1>
          {isHome && (
            <Link to="/info" className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-white/20" aria-label="Info">
              ⓘ
            </Link>
          )}
        </div>
      </header>
      <OfflineBanner />
      <main className="safe-bottom flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
