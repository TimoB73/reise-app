export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180

/** Luftlinie in Metern (Haversine-Formel). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Umwegfaktor: echte Fußwege sind im Schnitt ~30 % länger als die Luftlinie. */
export const WALK_DETOUR_FACTOR = 1.3
export const WALK_SPEED_KMH = 4.8

/** Geschätzte Gehzeit in Minuten (aufgerundet, mindestens 1). */
export function walkingMinutes(meters: number): number {
  const km = (meters * WALK_DETOUR_FACTOR) / 1000
  return Math.max(1, Math.ceil((km / WALK_SPEED_KMH) * 60))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`
}

/** Rastergröße für den Cache: ~555 m in Nord-Süd-Richtung. */
const CELL_DEG = 0.005

/**
 * Teilt die Welt in Zellen von ca. 500 m. Positionen innerhalb derselben Zelle
 * teilen sich zwischengespeicherte Ergebnisse.
 */
export function gridCell(p: LatLng): { key: string; center: LatLng } {
  const row = Math.round(p.lat / CELL_DEG)
  const lat = row * CELL_DEG
  const lngStep = CELL_DEG / Math.max(0.1, Math.cos(toRad(lat)))
  const col = Math.round(p.lng / lngStep)
  return { key: `${row}:${col}`, center: { lat, lng: col * lngStep } }
}

/** Maximaler Abstand einer Position zum Mittelpunkt ihrer Zelle (halbe Diagonale, aufgerundet). */
export const CELL_MAX_OFFSET_M = 450
