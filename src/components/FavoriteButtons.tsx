import { toggleFavorite, useFavorites } from '../lib/favorites'
import { isAppleDevice, navigationUrl, type TravelMode } from '../lib/navigation'
import type { Poi } from '../lib/poi'

const apple = typeof navigator !== 'undefined' && isAppleDevice()

export default function FavoriteButtons({ poi, mode, compact = false }: { poi: Poi; mode: TravelMode; compact?: boolean }) {
  const favorites = useFavorites()
  const fav = favorites[poi.id]
  const base = `flex flex-1 items-center justify-center gap-1 rounded-xl px-2 font-medium ${compact ? 'min-h-10 text-xs' : 'min-h-11 text-sm'}`

  return (
    <div className="flex gap-2">
      <button
        type="button"
        aria-pressed={Boolean(fav?.saved)}
        onClick={() => toggleFavorite(poi, 'saved')}
        className={`${base} ${fav?.saved ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}
      >
        {fav?.saved ? '★ Gemerkt' : '☆ Merken'}
      </button>
      <button
        type="button"
        aria-pressed={Boolean(fav?.visited)}
        onClick={() => toggleFavorite(poi, 'visited')}
        className={`${base} ${fav?.visited ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
      >
        {fav?.visited ? '✓ Besucht' : '○ Besucht'}
      </button>
      <a href={navigationUrl(poi, mode, apple)} target="_blank" rel="noreferrer" className={`${base} bg-brand-600 !text-white active:bg-brand-700`}>
        ➜ Route
      </a>
    </div>
  )
}
