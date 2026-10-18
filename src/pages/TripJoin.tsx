import { lazy, Suspense, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton } from '../components/forms'
import { ErrorBox } from '../components/StatusMessage'
import { useTrip } from '../context/TripContext'
import { loadDisplayName, saveDisplayName } from '../lib/displayName'
import { isAppleDevice } from '../lib/navigation'
import { userMessage } from '../lib/errors'
import { isValidCode, normalizeCode, parseJoinInput } from '../lib/trip'

const QrScanner = lazy(() => import('../components/QrScanner'))

// iOS trennt Safari und die installierte App: Eine Kopplung in Safari fehlt später in der App.
const iosBrowserTab =
  typeof navigator !== 'undefined' &&
  isAppleDevice() &&
  !(navigator as Navigator & { standalone?: boolean }).standalone &&
  !window.matchMedia?.('(display-mode: standalone)').matches

export default function TripJoin() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { joinTrip, configured } = useTrip()
  const [code, setCode] = useState(() => normalizeCode(params.get('code') ?? ''))
  const [displayName, setDisplayName] = useState(loadDisplayName)
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = async (c: string) => {
    if (busy) return
    if (!isValidCode(c)) return setError('Der Code besteht aus 6 Zeichen (Buchstaben und Ziffern).')
    if (!displayName.trim()) return setError('Bitte deinen Namen eingeben.')
    setBusy(true)
    setError(null)
    try {
      saveDisplayName(displayName)
      await joinTrip(c, displayName.trim())
      navigate('/reise', { replace: true })
    } catch (err) {
      setError(userMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void join(code)
  }

  const onScan = (text: string) => {
    setScanning(false)
    const c = parseJoinInput(text)
    if (!c) return setError('Dieser QR-Code gehört nicht zur Reise-App.')
    setCode(c)
    if (displayName.trim()) void join(c)
  }

  if (!configured) return <ErrorBox message="Die Synchronisierung ist nicht eingerichtet." />

  return (
    <form onSubmit={submit} className="space-y-4">
      {iosBrowserTab && (
        <p className="rounded-2xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          Du bist gerade in Safari. Wenn die Reise-App auf deinem Home-Bildschirm liegt, öffne sie dort und tritt in der App bei – sonst
          ist die Kopplung nur hier in Safari aktiv.
        </p>
      )}
      <button type="button" className={secondaryButton} onClick={() => setScanning(true)}>
        📷 QR-Code scannen
      </button>
      <div className={`${cardClass} space-y-4`}>
        <div>
          <label className={labelClass} htmlFor="join-code">
            Code
          </label>
          <input
            id="join-code"
            className={`${inputClass} text-center font-mono text-2xl tracking-[0.4em] uppercase`}
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="join-name">
            Dein Name
          </label>
          <input id="join-name" className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="So sieht dich dein Partner" maxLength={30} />
        </div>
      </div>
      {error && <ErrorBox message={error} />}
      <button type="submit" className={primaryButton} disabled={busy}>
        {busy ? 'Trete bei …' : 'Reise beitreten'}
      </button>
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onResult={onScan} onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </form>
  )
}
