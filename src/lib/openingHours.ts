import OpeningHours from 'opening_hours'

export type OpenState = 'open' | 'closed' | 'unknown'

export interface OpenStatus {
  state: OpenState
  /** Nächster Wechsel (öffnet/schließt), falls innerhalb der nächsten 7 Tage bekannt. */
  nextChange?: Date
}

export interface RegionContext {
  lat: number
  lng: number
  countryCode: string
  state: string
}

/** Wertet einen OSM-opening_hours-Wert aus. Ungültige Werte ergeben „unknown“. */
export function openStatus(value: string | undefined, now: Date, region?: RegionContext | null): OpenStatus {
  if (!value?.trim()) return { state: 'unknown' }
  try {
    const nominatim = region?.countryCode
      ? { lat: region.lat, lon: region.lng, address: { country_code: region.countryCode, state: region.state } }
      : null
    const oh = new OpeningHours(value, nominatim, 0)
    if (oh.getUnknown(now)) return { state: 'unknown' }
    const state: OpenState = oh.getState(now) ? 'open' : 'closed'
    const limit = new Date(now.getTime() + 7 * 24 * 3_600_000)
    const next = oh.getNextChange(now, limit)
    return { state, nextChange: next ?? undefined }
  } catch {
    return { state: 'unknown' }
  }
}

const time = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** Kurztext wie „Geöffnet · schließt um 22:00“ oder „Geschlossen · öffnet Mo 11:30“. */
export function openStatusText(s: OpenStatus, now: Date): string | null {
  if (s.state === 'unknown') return null
  const base = s.state === 'open' ? 'Geöffnet' : 'Geschlossen'
  if (!s.nextChange) return s.state === 'open' ? 'Geöffnet' : 'Geschlossen'
  const sameDay = s.nextChange.toDateString() === now.toDateString()
  const when = sameDay ? time(s.nextChange) : `${WEEKDAYS[s.nextChange.getDay()]} ${time(s.nextChange)}`
  return `${base} · ${s.state === 'open' ? 'schließt' : 'öffnet'} ${sameDay ? 'um ' : ''}${when}`
}
