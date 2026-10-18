import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardClass, inputClass, labelClass, primaryButton } from '../components/forms'
import { ErrorBox } from '../components/StatusMessage'
import { useTrip } from '../context/TripContext'
import { loadDisplayName, saveDisplayName } from '../lib/displayName'
import { userMessage } from '../lib/errors'
import { isoDate } from '../lib/trip'

export default function TripNew() {
  const navigate = useNavigate()
  const { createTrip, configured } = useTrip()
  const today = new Date()
  const [name, setName] = useState('')
  const [start, setStart] = useState(isoDate(today))
  const [end, setEnd] = useState(isoDate(new Date(today.getTime() + 7 * 86_400_000)))
  const [displayName, setDisplayName] = useState(loadDisplayName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (end < start) return setError('Das Enddatum darf nicht vor dem Startdatum liegen.')
    setBusy(true)
    setError(null)
    try {
      saveDisplayName(displayName)
      await createTrip({ name: name.trim(), start, end, displayName: displayName.trim() })
      navigate('/reise', { replace: true })
    } catch (err) {
      setError(userMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!configured) return <ErrorBox message="Die Synchronisierung ist nicht eingerichtet." />

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={`${cardClass} space-y-4`}>
        <div>
          <label className={labelClass} htmlFor="trip-name">
            Name der Reise
          </label>
          <input id="trip-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Toskana 2026" maxLength={80} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="trip-start">
              Startdatum
            </label>
            <input id="trip-start" type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="trip-end">
              Enddatum
            </label>
            <input id="trip-end" type="date" className={inputClass} value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="display-name">
            Dein Name
          </label>
          <input id="display-name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="So sieht dich dein Partner" maxLength={30} required />
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      <button type="submit" className={primaryButton} disabled={busy}>
        {busy ? 'Reise wird angelegt …' : 'Reise anlegen'}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">Danach bekommst du einen Code und einen QR-Code für deinen Partner.</p>
    </form>
  )
}
