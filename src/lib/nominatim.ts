import { cached, DAY } from './cache'
import { gridCell, type LatLng } from './geo'
import { fetchJson } from './http'

const BASE = 'https://nominatim.openstreetmap.org'

// Nominatim erlaubt höchstens 1 Anfrage pro Sekunde.
let queue: Promise<unknown> = Promise.resolve()
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.then(
    () => new Promise((r) => setTimeout(r, 1100)),
    () => new Promise((r) => setTimeout(r, 1100)),
  )
  return run
}

interface NominatimAddress {
  country_code?: string
  state?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  suburb?: string
  city_district?: string
  borough?: string
  hamlet?: string
  county?: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  name?: string
  address?: NominatimAddress
}

export interface Place extends LatLng {
  label: string
  detail: string
  countryCode: string
  state: string
}

function toPlace(r: NominatimResult): Place {
  const a = r.address ?? {}
  const locality = a.city || a.town || a.village || a.municipality || a.hamlet || r.name || ''
  const part = a.suburb || a.city_district || a.borough || ''
  const label = [locality, part].filter(Boolean).join(' – ') || r.display_name.split(',')[0]
  return {
    lat: Number(r.lat),
    lng: Number(r.lon),
    label,
    detail: r.display_name,
    countryCode: (a.country_code ?? '').toLowerCase(),
    state: a.state ?? a.county ?? '',
  }
}

/** Ortssuche. Nur auf ausdrücklichen Knopfdruck aufrufen (keine Autovervollständigung laut Nominatim-Nutzungsregeln). */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim()
  if (q.length < 2) return []
  return cached(`nominatim:search:${q.toLowerCase()}`, 7 * DAY, () =>
    throttled(async () => {
      const url = `${BASE}/search?format=jsonv2&addressdetails=1&limit=6&accept-language=de&q=${encodeURIComponent(q)}`
      const results = await fetchJson<NominatimResult[]>(url, { service: 'Die Ortssuche' })
      return results.map(toPlace)
    }),
  )
}

/** Ortsname zu einer Position (zwischengespeichert pro ~500-m-Zelle). */
export async function reverseGeocode(p: LatLng): Promise<Place> {
  const { key, center } = gridCell(p)
  return cached(`nominatim:reverse:${key}`, 7 * DAY, () =>
    throttled(async () => {
      const url = `${BASE}/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=de&lat=${center.lat}&lon=${center.lng}`
      const r = await fetchJson<NominatimResult & { error?: string }>(url, { service: 'Die Ortsbestimmung' })
      if (r.error) return { ...center, label: 'Unbekannter Ort', detail: '', countryCode: '', state: '' }
      return { ...toPlace(r), lat: center.lat, lng: center.lng }
    }),
  )
}
