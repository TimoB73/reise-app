import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cardClass, primaryButton, secondaryButton } from '../components/forms'
import QrCode from '../components/QrCode'
import { ErrorBox, Spinner } from '../components/StatusMessage'
import { useLocation } from '../context/LocationContext'
import { useTrip } from '../context/TripContext'
import { useNow } from '../hooks/useNow'
import { userMessage } from '../lib/errors'
import { distanceMeters, formatDistance } from '../lib/geo'
import { formatDateRange, isArchived, isPositionFresh, joinUrl, timeAgo } from '../lib/trip'

export default function TripPage() {
  const t = useTrip()
  const location = useLocation()
  const now = useNow(30_000).getTime()
  const [error, setError] = useState<string | null>(null)
  const [showCode, setShowCode] = useState(false)

  if (!t.configured) {
    return <ErrorBox message="Die Synchronisierung ist nicht eingerichtet (Supabase-Zugangsdaten fehlen im Build)." />
  }
  if (t.loading) return <Spinner label="Reise wird geladen …" />

  const otherTrips = t.trips.filter((x) => x.id !== t.trip?.id)

  if (!t.trip) {
    return (
      <div className="space-y-4">
        <section className={cardClass}>
          <h2 className="text-lg font-semibold">Zu zweit unterwegs?</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Koppelt eure Handys: Dann seht ihr gegenseitig, was gemerkt oder besucht wurde, und auf Wunsch, wo der andere gerade ist.
          </p>
        </section>
        <Link to="/reise/neu" className={`${primaryButton} flex items-center justify-center`}>
          ➕ Neue Reise anlegen
        </Link>
        <Link to="/reise/beitreten" className={secondaryButton}>
          🔗 Reise beitreten (Code oder QR)
        </Link>
        <TripList trips={otherTrips} onSelect={t.selectTrip} />
      </div>
    )
  }

  const trip = t.trip
  const url = joinUrl(trip.code)
  const partnerPos = isPositionFresh(t.partnerPosition, now) ? t.partnerPosition : null
  const isCreator = trip.created_by === t.userId
  const needsPartner = !t.partner && !t.archived

  const run = async (fn: () => Promise<void>, confirmText: string) => {
    if (!window.confirm(confirmText)) return
    setError(null)
    try {
      await fn()
    } catch (err) {
      setError(userMessage(err))
    }
  }

  const share = async () => {
    const text = `Komm in unsere Reise „${trip.name}“ in der Reise-App! Code: ${trip.code}`
    if (navigator.share) {
      await navigator.share({ title: 'Reise-App', text, url }).catch(() => undefined)
    } else {
      await navigator.clipboard?.writeText(`${text}\n${url}`).catch(() => undefined)
      window.alert('Einladung kopiert.')
    }
  }

  return (
    <div className="space-y-4">
      <section className={cardClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{trip.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateRange(trip)}</p>
          </div>
          {t.archived && <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium dark:bg-slate-700">Archiviert</span>}
        </div>
        {t.archived && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            Die Reise ist beendet. Merkliste und Besuche bleiben lesbar, können aber nicht mehr geändert werden.
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {t.me && (
            <li className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-blue-600" aria-hidden />
              <span className="font-medium">{t.me.display_name}</span>
              <span className="text-sm text-slate-500">(du)</span>
            </li>
          )}
          <li className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${t.partner ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} aria-hidden />
            {t.partner ? (
              <span className="min-w-0">
                <span className="font-medium">{t.partner.display_name}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {partnerPos && location.position
                    ? `📍 ${formatDistance(distanceMeters(location.position, partnerPos))} entfernt · ${timeAgo(partnerPos.updated_at, now)}`
                    : t.partnerPosition?.lat != null
                      ? `Standort zuletzt ${timeAgo(t.partnerPosition.updated_at, now)}`
                      : 'Standort nicht geteilt'}
                </span>
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Wartet auf Partner …</span>
            )}
          </li>
        </ul>
      </section>

      {(needsPartner || showCode) && (
        <section className={`${cardClass} space-y-3 text-center`}>
          <p className="font-medium">{needsPartner ? 'Lass deinen Partner diesen Code scannen:' : 'Code der Reise'}</p>
          <QrCode text={url} />
          <p className="font-mono text-3xl font-bold tracking-[0.3em]">{trip.code}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Oder in der App unter „Reise beitreten“ eintippen.</p>
          <button type="button" onClick={() => void share()} className={secondaryButton}>
            📤 Einladung teilen
          </button>
        </section>
      )}
      {!needsPartner && !t.archived && (
        <button type="button" onClick={() => setShowCode((s) => !s)} className="w-full text-sm text-brand-600 underline dark:text-brand-500">
          {showCode ? 'Code ausblenden' : 'Code und QR-Code anzeigen'}
        </button>
      )}

      {!t.archived && (
        <section className={cardClass}>
          <label className="flex min-h-12 items-center justify-between gap-4">
            <span>
              <span className="block font-medium">Meinen Standort teilen</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">
                {location.source === 'manual' ? 'Pausiert, solange ein Ort manuell gewählt ist.' : 'Nur solange die App geöffnet ist.'}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={t.sharePosition}
              onChange={(e) => t.setSharePosition(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-8 w-14 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-600 after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-6 dark:bg-slate-600" aria-hidden />
          </label>
        </section>
      )}

      {error && <ErrorBox message={error} />}

      <section className="space-y-3">
        {isCreator && t.partner && !t.archived && (
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              void run(
                t.removePartner,
                `Platz von ${t.partner!.display_name} freigeben? Seine Merkliste dieser Reise wird gelöscht. Danach kann er (oder jemand anderes) mit dem Code neu beitreten.`,
              )
            }
          >
            Partner-Platz freigeben
          </button>
        )}
        <button type="button" className={`${secondaryButton} !text-rose-600`} onClick={() => void run(t.leaveTrip, 'Reise wirklich verlassen? Deine Merkliste dieser Reise wird gelöscht.')}>
          Reise verlassen
        </button>
      </section>

      <TripList trips={otherTrips} onSelect={t.selectTrip} />
      <div className="grid grid-cols-2 gap-3">
        <Link to="/reise/neu" className={secondaryButton}>
          ➕ Neue Reise
        </Link>
        <Link to="/reise/beitreten" className={secondaryButton}>
          🔗 Beitreten
        </Link>
      </div>
    </div>
  )
}

function TripList({ trips, onSelect }: { trips: ReturnType<typeof useTrip>['trips']; onSelect: (id: string) => void }) {
  if (trips.length === 0) return null
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Weitere Reisen</h3>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
        {trips.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => onSelect(x.id)} className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800">
              <span>
                <span className="block font-medium">{x.name}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">{formatDateRange(x)}</span>
              </span>
              {isArchived(x) && <span className="text-xs text-slate-500">archiviert</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
