import type { ReactNode } from 'react'
import { useInView } from '../hooks/useInView'
import { useWikiInfo } from '../hooks/useWikiInfo'
import { formatDistance, formatDuration, walkingMinutes } from '../lib/geo'
import type { TravelMode } from '../lib/navigation'
import { KIND_INFO, type PoiWithDistance } from '../lib/poi'
import FavoriteButtons from './FavoriteButtons'

interface Props {
  poi: PoiWithDistance
  mode: TravelMode
  /** Zusatzzeile, z. B. Küche und Öffnungsstatus. */
  extra?: ReactNode
  /** Beschreibung, falls keine Wikipedia-Daten vorliegen. */
  fallbackText?: string
}

export default function PoiCard({ poi, mode, extra, fallbackText }: Props) {
  const { ref, inView } = useInView<HTMLLIElement>()
  const { info, loading } = useWikiInfo(poi.tags, inView)
  const kind = KIND_INFO[poi.kind]
  const description = info.extract ?? poi.tags['description:de'] ?? poi.tags.description ?? fallbackText

  return (
    <li ref={ref} id={`poi-${poi.id.replace('/', '-')}`} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <div className="flex gap-3 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          {info.image ? (
            <img src={info.image} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl" aria-hidden>
              {kind.icon}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{poi.name}</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {kind.icon} {kind.label} · {formatDistance(poi.distance)} · 🚶 {formatDuration(walkingMinutes(poi.distance))}
          </p>
          {extra && <div className="mt-1 text-sm">{extra}</div>}
        </div>
      </div>
      {(description || loading) && (
        <p className="px-3 pb-2 text-sm text-slate-700 dark:text-slate-300">
          {description ?? <span className="inline-block h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />}
          {info.url && (
            <>
              {' '}
              <a href={info.url} target="_blank" rel="noreferrer" className="text-brand-600 underline dark:text-brand-500">
                Wikipedia
              </a>
            </>
          )}
        </p>
      )}
      <div className="px-3 pb-3">
        <FavoriteButtons poi={poi} mode={mode} />
      </div>
    </li>
  )
}
