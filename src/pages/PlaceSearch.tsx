import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox, Spinner } from '../components/StatusMessage'
import { useLocation } from '../context/LocationContext'
import { userMessage } from '../lib/errors'
import { searchPlaces, type Place } from '../lib/nominatim'

export default function PlaceSearch() {
  const navigate = useNavigate()
  const { setManual, useGps, source } = useLocation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2 || loading) return
    setLoading(true)
    setError(null)
    try {
      setResults(await searchPlaces(query))
    } catch (err) {
      setError(userMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  const choose = (p: Place) => {
    setManual(p)
    goBack()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ort, Adresse oder Sehenswürdigkeit"
          className="min-h-12 min-w-0 flex-1 rounded-xl border-0 bg-white px-4 shadow-sm outline-none ring-brand-500 focus:ring-2 dark:bg-slate-900"
          autoFocus
          enterKeyHint="search"
        />
        <button type="submit" className="min-h-12 rounded-xl bg-brand-600 px-4 font-medium text-white active:bg-brand-700" disabled={loading}>
          Suchen
        </button>
      </form>

      {source === 'manual' && (
        <button
          type="button"
          onClick={() => {
            useGps()
            goBack()
          }}
          className="min-h-12 w-full rounded-xl bg-white font-medium shadow-sm active:bg-slate-100 dark:bg-slate-900"
        >
          📍 Wieder GPS-Standort verwenden
        </button>
      )}

      {loading && <Spinner label="Suche läuft …" />}
      {error && <ErrorBox message={error} />}
      {results && results.length === 0 && !loading && <p className="text-center text-slate-500">Nichts gefunden. Anders schreiben?</p>}
      {results && results.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm dark:divide-slate-800 dark:bg-slate-900">
          {results.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button type="button" onClick={() => choose(p)} className="w-full px-4 py-3 text-left active:bg-slate-100 dark:active:bg-slate-800">
                <span className="block font-medium">{p.label}</span>
                <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{p.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
