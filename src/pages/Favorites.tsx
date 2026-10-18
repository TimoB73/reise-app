import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FavoriteButtons from '../components/FavoriteButtons'
import { EmptyBox } from '../components/StatusMessage'
import { useLocation } from '../context/LocationContext'
import { useTrip } from '../context/TripContext'
import { useFavoritesSnapshot, type FavoriteRecord } from '../lib/favorites'
import { distanceMeters, formatDistance } from '../lib/geo'
import { KIND_INFO, type Poi } from '../lib/poi'

type Filter = 'saved' | 'visited'

const chip = (active: boolean) =>
  `min-h-10 shrink-0 rounded-full px-4 text-sm font-medium ${active ? 'bg-brand-600 text-white' : 'bg-white shadow-sm dark:bg-slate-900'}`

export default function Favorites() {
  const snapshot = useFavoritesSnapshot()
  const { partner, trip } = useTrip()
  const { position } = useLocation()
  const [filter, setFilter] = useState<Filter>('saved')
  const [person, setPerson] = useState<'me' | 'partner'>('me')

  const owner = person === 'partner' && partner ? partner.user_id : snapshot.myId
  const list = useMemo(() => {
    const items = Object.values(snapshot.records).filter((r) => r.userId === owner && r[filter])
    return items
      .map((r) => ({ rec: r, distance: position ? distanceMeters(position, r) : null }))
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  }, [snapshot.records, owner, filter, position])

  return (
    <div className="space-y-3">
      {partner && (
        <div className="flex gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
          {(['me', 'partner'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPerson(p)}
              aria-pressed={person === p}
              className={`min-h-11 flex-1 rounded-lg text-sm font-medium ${person === p ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {p === 'me' ? 'Meine' : `Von ${partner.display_name}`}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" className={chip(filter === 'saved')} onClick={() => setFilter('saved')} aria-pressed={filter === 'saved'}>
          ★ Gemerkt
        </button>
        <button type="button" className={chip(filter === 'visited')} onClick={() => setFilter('visited')} aria-pressed={filter === 'visited'}>
          ✓ Besucht
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyBox>
          {filter === 'saved' ? 'Noch nichts gemerkt.' : 'Noch nichts als besucht markiert.'}
          {!trip && (
            <p className="mt-2 text-sm">
              Tipp: Unter <Link to="/reise" className="text-brand-600 underline">Reise</Link> könnt ihr eure Listen zu zweit teilen.
            </p>
          )}
        </EmptyBox>
      ) : (
        <ul className="space-y-3">
          {list.map(({ rec, distance }) => (
            <FavoriteItem key={`${rec.userId}|${rec.poiId}`} rec={rec} distance={distance} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FavoriteItem({ rec, distance }: { rec: FavoriteRecord; distance: number | null }) {
  const poi: Poi = { id: rec.poiId, name: rec.name, kind: rec.kind, lat: rec.lat, lng: rec.lng, tags: {} }
  const kind = KIND_INFO[rec.kind] ?? KIND_INFO.attraction
  return (
    <li className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <div className="mb-2 flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {kind.icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{rec.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {kind.label}
            {distance !== null && ` · ${formatDistance(distance)}`}
          </p>
        </div>
      </div>
      <FavoriteButtons poi={poi} mode={distance !== null && distance > 3000 ? 'driving' : 'walking'} />
    </li>
  )
}
