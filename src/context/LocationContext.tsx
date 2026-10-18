import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { gridCell, type LatLng } from '../lib/geo'
import { reverseGeocode, type Place } from '../lib/nominatim'

type Source = 'gps' | 'manual'
type Status = 'locating' | 'ready' | 'error'

interface LocationState {
  source: Source
  status: Status
  position: LatLng | null
  accuracy: number | null
  error: string | null
  /** Ortsname und Region (für Feiertage bei Öffnungszeiten). */
  place: Place | null
  useGps: () => void
  setManual: (place: Place) => void
}

const LocationContext = createContext<LocationState | null>(null)
const MANUAL_KEY = 'reise-app:manual-place'

function loadManual(): Place | null {
  try {
    const raw = localStorage.getItem(MANUAL_KEY)
    return raw ? (JSON.parse(raw) as Place) : null
  } catch {
    return null
  }
}

const GEO_ERRORS: Record<number, string> = {
  1: 'Standortzugriff wurde nicht erlaubt. Bitte in den Einstellungen freigeben oder einen Ort manuell suchen.',
  2: 'Standort konnte nicht bestimmt werden. Bitte einen Ort manuell suchen.',
  3: 'Standortbestimmung dauert zu lange. Bitte unter freiem Himmel erneut versuchen oder einen Ort suchen.',
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [manual, setManualPlace] = useState<Place | null>(loadManual)
  const [gps, setGps] = useState<{ position: LatLng; accuracy: number } | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [place, setPlace] = useState<Place | null>(null)

  const source: Source = manual ? 'manual' : 'gps'

  useEffect(() => {
    if (manual) return
    if (!('geolocation' in navigator)) {
      setGpsError('Dieses Gerät unterstützt keine Standortbestimmung. Bitte einen Ort manuell suchen.')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null)
        setGps({ position: { lat: pos.coords.latitude, lng: pos.coords.longitude }, accuracy: pos.coords.accuracy })
      },
      (err) => setGpsError(GEO_ERRORS[err.code] ?? GEO_ERRORS[2]),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 30_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [manual])

  const position = manual ?? gps?.position ?? null
  const cellKey = position ? gridCell(position).key : null

  // Ortsname nur bei Wechsel der ~500-m-Zelle neu abfragen
  useEffect(() => {
    if (manual) {
      setPlace(manual)
      return
    }
    if (!position) return
    let cancelled = false
    const timer = setTimeout(() => {
      reverseGeocode(position)
        .then((p) => !cancelled && setPlace(p))
        .catch(() => undefined)
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cellKey, manual])

  const useGps = useCallback(() => {
    try {
      localStorage.removeItem(MANUAL_KEY)
    } catch {
      // ignorieren
    }
    setManualPlace(null)
    setPlace(null)
  }, [])

  const setManual = useCallback((p: Place) => {
    try {
      localStorage.setItem(MANUAL_KEY, JSON.stringify(p))
    } catch {
      // ignorieren
    }
    setManualPlace(p)
  }, [])

  const value = useMemo<LocationState>(
    () => ({
      source,
      status: position ? 'ready' : gpsError ? 'error' : 'locating',
      position,
      accuracy: manual ? null : (gps?.accuracy ?? null),
      error: manual ? null : gpsError,
      place,
      useGps,
      setManual,
    }),
    [source, position, gpsError, manual, gps?.accuracy, place, useGps, setManual],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation(): LocationState {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation muss innerhalb von LocationProvider verwendet werden')
  return ctx
}
