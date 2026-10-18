import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import type { TravelMode } from '../lib/navigation'
import type { PoiWithDistance } from '../lib/poi'
import { EmptyBox, ErrorBox, Spinner } from './StatusMessage'
import ViewToggle, { type View } from './ViewToggle'

const PoiMap = lazy(() => import('./PoiMap'))
const PAGE_SIZE = 30

interface Props {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  onRetry: () => void
  pois: PoiWithDistance[]
  mode: TravelMode
  loadingLabel: string
  emptyText: string
  /** Filterleiste oberhalb der Ergebnisse. */
  filters?: ReactNode
  renderCard: (poi: PoiWithDistance) => ReactNode
}

export default function PoiExplorer({ status, error, onRetry, pois, mode, loadingLabel, emptyText, filters, renderCard }: Props) {
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('ansicht') === 'karte' ? 'karte' : 'liste'
  const [limit, setLimit] = useState(PAGE_SIZE)

  if (!location.position) {
    if (location.status === 'error') {
      return (
        <ErrorBox message={location.error ?? 'Standort unbekannt.'}>
          <Link to="/ort" className="flex min-h-11 items-center rounded-xl bg-white px-4 font-medium text-rose-900">
            🔎 Ort suchen
          </Link>
        </ErrorBox>
      )
    }
    return <Spinner label="Standort wird bestimmt …" />
  }

  const setView = (v: View) => setParams(v === 'karte' ? { ansicht: 'karte' } : {}, { replace: true })

  return (
    <div className="space-y-3">
      <ViewToggle view={view} onChange={setView} />
      {filters}
      {status === 'error' && error && <ErrorBox message={error} onRetry={onRetry} />}
      {(status === 'loading' || status === 'idle') && pois.length === 0 && <Spinner label={loadingLabel} />}
      {status === 'ready' && pois.length === 0 && <EmptyBox>{emptyText}</EmptyBox>}

      {pois.length > 0 && view === 'karte' && (
        <Suspense fallback={<Spinner label="Karte wird geladen …" />}>
          <PoiMap pois={pois} center={location.position} accuracy={location.accuracy} mode={mode} />
        </Suspense>
      )}

      {pois.length > 0 && view === 'liste' && (
        <>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pois.length} Treffer, nach Entfernung sortiert
            {status === 'loading' && ' · wird aktualisiert …'}
          </p>
          <ul className="space-y-3">{pois.slice(0, limit).map(renderCard)}</ul>
          {pois.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="min-h-12 w-full rounded-2xl bg-white font-medium shadow-sm active:bg-slate-100 dark:bg-slate-900 dark:active:bg-slate-800"
            >
              Weitere {Math.min(PAGE_SIZE, pois.length - limit)} anzeigen
            </button>
          )}
        </>
      )}
    </div>
  )
}
