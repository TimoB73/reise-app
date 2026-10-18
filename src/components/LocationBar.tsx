import { Link } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'

export default function LocationBar() {
  const { status, source, place, accuracy, error, useGps } = useLocation()

  let main: string
  let sub: string
  if (status === 'error') {
    main = 'Standort unbekannt'
    sub = error ?? ''
  } else if (status === 'locating') {
    main = 'Standort wird bestimmt …'
    sub = 'Bitte Standortzugriff erlauben'
  } else {
    main = place?.label ?? 'Standort gefunden'
    sub = source === 'manual' ? 'Manuell gewählt' : `GPS${accuracy ? ` · ±${Math.round(accuracy)} m` : ''}`
  }

  return (
    <section className="rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>
          {status === 'error' ? '⚠️' : source === 'manual' ? '📌' : '📍'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{main}</p>
          <p className={`text-sm ${status === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{sub}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link to="/ort" className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-medium active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700">
          🔎 Ort suchen
        </Link>
        {source === 'manual' && (
          <button type="button" onClick={useGps} className="min-h-11 flex-1 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white active:bg-brand-700">
            📍 GPS verwenden
          </button>
        )}
      </div>
    </section>
  )
}
