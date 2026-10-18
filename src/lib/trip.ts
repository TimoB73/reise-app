import { distanceMeters, type LatLng } from './geo'

export interface Trip {
  id: string
  name: string
  start_date: string
  end_date: string
  code: string
  created_by: string
  created_at: string
}

export interface Member {
  trip_id: string
  user_id: string
  display_name: string
  joined_at: string
}

export interface PositionRow {
  trip_id: string
  user_id: string
  lat: number | null
  lng: number | null
  accuracy: number | null
  updated_at: string
}

export const CODE_LENGTH = 6
const CODE_ALPHABET = /^[A-HJ-NP-Z2-9]{6}$/

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
}

export function isValidCode(code: string): boolean {
  return CODE_ALPHABET.test(code)
}

/** Liest einen Code aus einem gescannten QR-Inhalt (Einladungslink oder reiner Code). */
export function parseJoinInput(text: string): string | null {
  const m = /[?&]code=([A-Za-z0-9]{6})\b/.exec(text)
  if (m) return normalizeCode(m[1])
  const code = normalizeCode(text.trim())
  return isValidCode(code) && text.trim().length <= 10 ? code : null
}

export function joinUrl(code: string, base = `${location.origin}${location.pathname}`): string {
  return `${base}#/reise/beitreten?code=${code}`
}

/** Datum als YYYY-MM-DD in lokaler Zeit. */
export function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Eine Reise ist nach ihrem Enddatum archiviert (schreibgeschützt). */
export function isArchived(trip: Pick<Trip, 'end_date'>, today: Date = new Date()): boolean {
  return trip.end_date < isoDate(today)
}

export function formatDateRange(trip: Pick<Trip, 'start_date' | 'end_date'>): string {
  const fmt = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
  return trip.start_date === trip.end_date ? fmt(trip.start_date) : `${fmt(trip.start_date)} – ${fmt(trip.end_date)}`
}

/** Aktuelle Reise wählen: gespeicherte, sonst die laufende/nächste nicht archivierte. */
export function pickCurrentTrip(trips: Trip[], savedId: string | null, today = new Date()): Trip | null {
  const saved = trips.find((t) => t.id === savedId)
  if (saved) return saved
  const active = trips.filter((t) => !isArchived(t, today)).sort((a, b) => a.start_date.localeCompare(b.start_date))
  return active[0] ?? null
}

export const POSITION_MIN_INTERVAL_MS = 10_000
export const POSITION_HEARTBEAT_MS = 60_000
export const POSITION_MIN_MOVE_M = 25
/** Positionen gelten als veraltet, wenn die App des Partners länger nichts gesendet hat (App geschlossen). */
export const POSITION_STALE_MS = 3 * 60_000

export function shouldSendPosition(last: { pos: LatLng; at: number } | null, pos: LatLng, now: number): boolean {
  if (!last) return true
  const elapsed = now - last.at
  if (elapsed >= POSITION_HEARTBEAT_MS) return true
  return elapsed >= POSITION_MIN_INTERVAL_MS && distanceMeters(last.pos, pos) >= POSITION_MIN_MOVE_M
}

export function isPositionFresh(p: Pick<PositionRow, 'lat' | 'lng' | 'updated_at'> | null, now: number): p is PositionRow & { lat: number; lng: number } {
  return Boolean(p && p.lat !== null && p.lng !== null && now - new Date(p.updated_at).getTime() < POSITION_STALE_MS)
}

export function timeAgo(iso: string, now: number): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} Std.`
  return `vor ${Math.floor(h / 24)} Tagen`
}
