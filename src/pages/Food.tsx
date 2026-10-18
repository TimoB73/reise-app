import { useMemo, useState } from 'react'
import PoiCard from '../components/PoiCard'
import PoiExplorer from '../components/PoiExplorer'
import { useLocation } from '../context/LocationContext'
import { useNow } from '../hooks/useNow'
import { usePois, type PoiSource } from '../hooks/usePois'
import { openStatus, openStatusText, type OpenStatus } from '../lib/openingHours'
import { fetchPois, foodQuery } from '../lib/overpass'
import { cuisineLabel, cuisines, KIND_INFO, withDistance, type PoiKind } from '../lib/poi'

const RADIUS = 2000
const TYPES: PoiKind[] = ['restaurant', 'cafe', 'bar', 'pub', 'biergarten']

const source: PoiSource = { id: 'food', radius: RADIUS, load: (center, radius) => fetchPois(foodQuery(center, radius)) }

const chip = (active: boolean) =>
  `min-h-10 shrink-0 rounded-full px-3 text-sm font-medium ${active ? 'bg-brand-600 text-white' : 'bg-white shadow-sm dark:bg-slate-900'}`

export default function Food() {
  const { position, place } = useLocation()
  const { status, pois, error, refresh } = usePois(source, position)
  const now = useNow()
  const [types, setTypes] = useState<Set<PoiKind>>(new Set())
  const [cuisine, setCuisine] = useState('')
  const [openOnly, setOpenOnly] = useState(false)

  const withStatus = useMemo(() => {
    if (!position) return []
    const region = place ? { lat: place.lat, lng: place.lng, countryCode: place.countryCode, state: place.state } : null
    return withDistance(pois, position, RADIUS).map((p) => ({ ...p, open: openStatus(p.tags.opening_hours, now, region) }))
  }, [pois, position, place, now])

  const cuisineOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of withStatus) for (const c of cuisines(p.tags)) counts.set(c, (counts.get(c) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)
  }, [withStatus])

  const filtered = withStatus.filter(
    (p) =>
      (types.size === 0 || types.has(p.kind)) &&
      (!cuisine || cuisines(p.tags).includes(cuisine)) &&
      (!openOnly || p.open.state === 'open'),
  )
  const openByPoi = new Map(withStatus.map((p) => [p.id, p.open]))
  const unknownHidden = openOnly ? withStatus.filter((p) => p.open.state === 'unknown').length : 0

  const toggleType = (t: PoiKind) =>
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const filters = (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" className={chip(openOnly)} aria-pressed={openOnly} onClick={() => setOpenOnly((o) => !o)}>
          🕒 Jetzt geöffnet
        </button>
        {TYPES.map((t) => (
          <button key={t} type="button" className={chip(types.has(t))} aria-pressed={types.has(t)} onClick={() => toggleType(t)}>
            {KIND_INFO[t].icon} {KIND_INFO[t].label}
          </button>
        ))}
      </div>
      {cuisineOptions.length > 0 && (
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="min-h-11 w-full rounded-xl border-0 bg-white px-3 shadow-sm dark:bg-slate-900"
          aria-label="Küche"
        >
          <option value="">Alle Küchen</option>
          {cuisineOptions.map((c) => (
            <option key={c} value={c}>
              {cuisineLabel(c)}
            </option>
          ))}
        </select>
      )}
      {unknownHidden > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{unknownHidden} Lokale ohne Öffnungszeiten sind ausgeblendet.</p>
      )}
    </div>
  )

  return (
    <PoiExplorer
      status={status}
      error={error}
      onRetry={refresh}
      pois={filtered}
      mode="walking"
      loadingLabel="Restaurants und Bars werden gesucht …"
      emptyText={withStatus.length > 0 ? 'Keine Treffer für diese Filter.' : 'Im Umkreis von 2 km wurden keine Lokale gefunden.'}
      filters={filters}
      renderCard={(p) => {
        const open = openByPoi.get(p.id)
        const kitchens = cuisines(p.tags).map(cuisineLabel).join(', ')
        return (
          <PoiCard
            key={p.id}
            poi={p}
            mode="walking"
            extra={<FoodExtra open={open} now={now} kitchens={kitchens} />}
            fallbackText={p.tags.opening_hours ? `Öffnungszeiten: ${p.tags.opening_hours}` : undefined}
          />
        )
      }}
    />
  )
}

function FoodExtra({ open, now, kitchens }: { open?: OpenStatus; now: Date; kitchens: string }) {
  const text = open ? openStatusText(open, now) : null
  return (
    <>
      {kitchens && <p className="text-slate-600 dark:text-slate-300">{kitchens}</p>}
      {text && (
        <p className={open?.state === 'open' ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-rose-600 dark:text-rose-400'}>
          {text}
        </p>
      )}
    </>
  )
}
