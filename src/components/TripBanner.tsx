import { Link } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { useNow } from '../hooks/useNow'
import { isPositionFresh } from '../lib/trip'

export default function TripBanner() {
  const { configured, loading, trip, partner, partnerPosition, archived } = useTrip()
  const now = useNow(30_000).getTime()
  if (!configured || loading) return null

  if (!trip) {
    return (
      <Link to="/reise" className="flex min-h-14 items-center gap-3 rounded-2xl bg-brand-50 p-3 text-brand-700 active:bg-brand-100 dark:bg-brand-700/20 dark:text-brand-100">
        <span className="text-2xl" aria-hidden>
          👫
        </span>
        <span className="flex-1 text-sm font-medium">Zu zweit unterwegs? Reise anlegen oder beitreten</span>
        <span aria-hidden>›</span>
      </Link>
    )
  }

  const online = isPositionFresh(partnerPosition, now)
  return (
    <Link to="/reise" className="flex min-h-14 items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:bg-slate-100 dark:bg-slate-900 dark:active:bg-slate-800">
      <span className="text-2xl" aria-hidden>
        🧳
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{trip.name}</span>
        <span className="block text-sm text-slate-500 dark:text-slate-400">
          {archived
            ? 'Archiviert'
            : partner
              ? `mit ${partner.display_name}${online ? ' · 🟢 online' : ''}`
              : 'Wartet auf Partner – Code anzeigen'}
        </span>
      </span>
      <span className="text-2xl text-slate-400" aria-hidden>
        ›
      </span>
    </Link>
  )
}
