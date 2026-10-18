import { describe, expect, it } from 'vitest'
import { openStatus, openStatusText } from './openingHours'

// Mittwoch, 15. Oktober 2025
const wed = (h: number, m = 0) => new Date(2025, 9, 15, h, m)
const bavaria = { lat: 48.137, lng: 11.575, countryCode: 'de', state: 'Bayern' }

describe('openStatus', () => {
  it('erkennt geöffnet und geschlossen', () => {
    expect(openStatus('Mo-Fr 09:00-18:00', wed(12)).state).toBe('open')
    expect(openStatus('Mo-Fr 09:00-18:00', wed(20)).state).toBe('closed')
    expect(openStatus('Sa-Su 10:00-16:00', wed(12)).state).toBe('closed')
  })

  it('kennt 24/7', () => {
    expect(openStatus('24/7', wed(3)).state).toBe('open')
  })

  it('behandelt Öffnungszeiten über Mitternacht', () => {
    expect(openStatus('Mo-Su 18:00-02:00', new Date(2025, 9, 16, 1, 0)).state).toBe('open')
  })

  it('liefert den nächsten Wechsel', () => {
    const s = openStatus('Mo-Fr 09:00-18:00', wed(12))
    expect(s.nextChange?.getHours()).toBe(18)
  })

  it('liefert „unknown“ bei leeren oder ungültigen Werten', () => {
    expect(openStatus(undefined, wed(12)).state).toBe('unknown')
    expect(openStatus('nach Vereinbarung irgendwann', wed(12)).state).toBe('unknown')
  })

  it('berücksichtigt Feiertage mit Region', () => {
    // 3. Oktober (Tag der Deutschen Einheit) ist ein Freitag in 2025
    const holiday = new Date(2025, 9, 3, 12, 0)
    expect(openStatus('Mo-Fr 09:00-18:00; PH off', holiday, bavaria).state).toBe('closed')
    expect(openStatus('Mo-Fr 09:00-18:00; PH off', wed(12), bavaria).state).toBe('open')
  })
})

describe('openStatusText', () => {
  it('formuliert Status mit Uhrzeit', () => {
    const now = wed(12)
    expect(openStatusText(openStatus('Mo-Fr 09:00-18:00', now), now)).toBe('Geöffnet · schließt um 18:00')
    const evening = wed(20)
    expect(openStatusText(openStatus('Mo-Fr 09:00-18:00', evening), evening)).toBe('Geschlossen · öffnet Do 09:00')
  })
  it('liefert null bei unbekanntem Status', () => {
    expect(openStatusText({ state: 'unknown' }, wed(12))).toBeNull()
  })
})
