import { Link } from 'react-router-dom'
import LocationBar from '../components/LocationBar'
import TripBanner from '../components/TripBanner'
import { useFavoritesSnapshot } from '../lib/favorites'

const categories = [
  { icon: '🚶', title: 'Highlights zu Fuß', subtitle: 'Sehenswertes im Umkreis von 2 km', to: '/zu-fuss' },
  { icon: '🚗', title: 'Highlights mit dem Auto', subtitle: 'Bedeutende Ziele in unter 1 Stunde', to: null },
  { icon: '✨', title: 'Spektakuläre Highlights', subtitle: 'Die Top 15 in unter 2 Stunden', to: null },
  { icon: '📜', title: 'Geschichte der Region', subtitle: 'Was diesen Ort geprägt hat', to: null },
  { icon: '🍽️', title: 'Restaurants & Bars', subtitle: 'Essen und Trinken zu Fuß erreichbar', to: '/essen' },
]

const tile = 'flex min-h-20 w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm dark:bg-slate-900'

export default function Home() {
  const snapshot = useFavoritesSnapshot()
  const savedCount = Object.values(snapshot.records).filter((r) => r.userId === snapshot.myId && r.saved).length

  return (
    <div className="space-y-4">
      <LocationBar />
      <TripBanner />
      <ul className="space-y-3">
        {categories.map((c) => {
          const content = (
            <>
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{c.title}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">{c.subtitle}</span>
              </span>
              {c.to ? (
                <span className="text-2xl text-slate-400" aria-hidden>
                  ›
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">bald</span>
              )}
            </>
          )
          return (
            <li key={c.title}>
              {c.to ? (
                <Link to={c.to} className={`${tile} active:bg-slate-100 dark:active:bg-slate-800`}>
                  {content}
                </Link>
              ) : (
                <div className={`${tile} opacity-60`} aria-disabled>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <Link to="/merkliste" className={`${tile} active:bg-slate-100 dark:active:bg-slate-800`}>
        <span className="text-3xl" aria-hidden>
          ⭐
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Merkliste</span>
          <span className="block text-sm text-slate-500 dark:text-slate-400">
            {savedCount === 0 ? 'Gemerkte und besuchte Orte' : `${savedCount} ${savedCount === 1 ? 'Ort' : 'Orte'} gemerkt`}
          </span>
        </span>
        <span className="text-2xl text-slate-400" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  )
}
