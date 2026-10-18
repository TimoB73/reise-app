import { favoritesFor, toggleFavorite, useFavoritesSnapshot } from '../lib/favorites'
import { isAppleDevice, navigationUrl, type TravelMode } from '../lib/navigation'
import type { Poi } from '../lib/poi'
import { useTrip } from '../context/TripContext'

const apple = typeof navigator !== 'undefined' && isAppleDevice()

export default function FavoriteButtons({ poi, mode, compact = false }: { poi: Poi; mode: TravelMode; compact?: boolean }) {
  const snapshot = useFavoritesSnapshot()
  const { members } = useTrip()
  const { mine, others } = favoritesFor(snapshot, poi.id)
  const disabled = snapshot.readOnly
  const base = `flex flex-1 items-center justify-center gap-1 rounded-xl px-2 font-medium disabled:opacity-50 ${compact ? 'min-h-10 text-xs' : 'min-h-11 text-sm'}`
  const nameOf = (userId: string) => members.find((m) => m.user_id === userId)?.display_name ?? 'Partner'

  return (
    <div className="space-y-2">
      {others.length > 0 && (
        <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
          {others
            .map((o) => `${nameOf(o.userId)}: ${[o.saved && '★ gemerkt', o.visited && '✓ besucht'].filter(Boolean).join(', ')}`)
            .join(' · ')}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={Boolean(mine?.saved)}
          onClick={() => void toggleFavorite(poi, 'saved')}
          className={`${base} ${mine?.saved ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          {mine?.saved ? '★ Gemerkt' : '☆ Merken'}
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={Boolean(mine?.visited)}
          onClick={() => void toggleFavorite(poi, 'visited')}
          className={`${base} ${mine?.visited ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
        >
          {mine?.visited ? '✓ Besucht' : '○ Besucht'}
        </button>
        <a href={navigationUrl(poi, mode, apple)} target="_blank" rel="noreferrer" className={`${base} bg-brand-600 !text-white active:bg-brand-700`}>
          ➜ Route
        </a>
      </div>
    </div>
  )
}
