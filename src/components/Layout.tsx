import { Suspense } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Spinner } from './StatusMessage'
import OfflineBanner from './OfflineBanner'

const TITLES: Record<string, string> = {
  '/zu-fuss': 'Highlights zu Fuß',
  '/essen': 'Restaurants & Bars',
  '/ort': 'Ort wählen',
  '/info': 'Info',
}

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="safe-top sticky top-0 z-10 bg-brand-600 text-white shadow">
        <div className="flex h-14 items-center gap-2 px-4">
          {!isHome && (
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-2xl active:bg-white/20"
              aria-label="Zurück"
            >
              ‹
            </button>
          )}
          <h1 className="flex-1 truncate text-lg font-semibold">{TITLES[pathname] ?? 'Reise-App'}</h1>
          {isHome && (
            <Link to="/info" className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-white/20" aria-label="Info">
              ⓘ
            </Link>
          )}
        </div>
      </header>
      <OfflineBanner />
      <main className="safe-bottom flex-1 px-4 py-4">
        <Suspense fallback={<Spinner label="Wird geladen …" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
