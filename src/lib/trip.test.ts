import { describe, expect, it } from 'vitest'
import {
  formatDateRange,
  isArchived,
  isPositionFresh,
  isValidCode,
  joinUrl,
  normalizeCode,
  parseJoinInput,
  pickCurrentTrip,
  shouldSendPosition,
  timeAgo,
  type Trip,
} from './trip'

const trip = (id: string, start: string, end: string): Trip => ({
  id,
  name: id,
  start_date: start,
  end_date: end,
  code: 'ABC234',
  created_by: 'u1',
  created_at: '2026-01-01T00:00:00Z',
})

describe('Codes', () => {
  it('normalisiert Eingaben', () => {
    expect(normalizeCode(' abc 234 ')).toBe('ABC234')
    expect(normalizeCode('abc-234-xyz')).toBe('ABC234')
  })
  it('prüft das Format (ohne verwechselbare Zeichen)', () => {
    expect(isValidCode('ABC234')).toBe(true)
    expect(isValidCode('ABC23')).toBe(false)
    expect(isValidCode('ABCO10')).toBe(false) // O, 1, 0 kommen nicht vor
  })
  it('liest Codes aus Einladungslinks und Rohtext', () => {
    expect(parseJoinInput('https://timob73.github.io/reise-app/#/reise/beitreten?code=XYZ789')).toBe('XYZ789')
    expect(parseJoinInput('xyz789')).toBe('XYZ789')
    expect(parseJoinInput('https://example.com/irgendwas')).toBeNull()
    expect(parseJoinInput('Hallo Welt, wie geht es')).toBeNull()
  })
  it('baut Einladungslinks', () => {
    expect(joinUrl('ABC234', 'https://timob73.github.io/reise-app/')).toBe('https://timob73.github.io/reise-app/#/reise/beitreten?code=ABC234')
  })
})

describe('Archivierung', () => {
  const today = new Date(2026, 9, 18, 15, 0)
  it('ist am Enddatum noch aktiv', () => {
    expect(isArchived(trip('a', '2026-10-10', '2026-10-18'), today)).toBe(false)
  })
  it('ist nach dem Enddatum archiviert', () => {
    expect(isArchived(trip('a', '2026-10-10', '2026-10-17'), today)).toBe(true)
  })
})

describe('pickCurrentTrip', () => {
  const today = new Date(2026, 9, 18)
  const past = trip('alt', '2026-01-01', '2026-01-10')
  const now = trip('jetzt', '2026-10-15', '2026-10-25')
  const later = trip('später', '2026-12-01', '2026-12-10')
  it('nimmt die gespeicherte Reise', () => {
    expect(pickCurrentTrip([past, now], 'alt', today)?.id).toBe('alt')
  })
  it('sonst die früheste nicht archivierte', () => {
    expect(pickCurrentTrip([later, past, now], null, today)?.id).toBe('jetzt')
  })
  it('null, wenn alle archiviert sind', () => {
    expect(pickCurrentTrip([past], null, today)).toBeNull()
  })
})

describe('Position teilen', () => {
  const p = { lat: 48.137, lng: 11.575 }
  const near = { lat: 48.1371, lng: 11.5751 } // ~13 m
  const far = { lat: 48.1375, lng: 11.575 } // ~55 m
  it('sendet beim ersten Mal sofort', () => {
    expect(shouldSendPosition(null, p, 0)).toBe(true)
  })
  it('sendet nicht bei kleinen Bewegungen', () => {
    expect(shouldSendPosition({ pos: p, at: 0 }, near, 20_000)).toBe(false)
  })
  it('sendet bei größerer Bewegung nach der Mindestpause', () => {
    expect(shouldSendPosition({ pos: p, at: 0 }, far, 5_000)).toBe(false)
    expect(shouldSendPosition({ pos: p, at: 0 }, far, 11_000)).toBe(true)
  })
  it('sendet spätestens nach 60 s (Herzschlag)', () => {
    expect(shouldSendPosition({ pos: p, at: 0 }, p, 60_000)).toBe(true)
  })
  it('wertet alte oder leere Positionen als nicht aktuell', () => {
    const now = Date.parse('2026-10-18T12:00:00Z')
    expect(isPositionFresh({ lat: 1, lng: 2, updated_at: '2026-10-18T11:59:00Z' }, now)).toBe(true)
    expect(isPositionFresh({ lat: 1, lng: 2, updated_at: '2026-10-18T11:50:00Z' }, now)).toBe(false)
    expect(isPositionFresh({ lat: null, lng: null, updated_at: '2026-10-18T11:59:30Z' }, now)).toBe(false)
    expect(isPositionFresh(null, now)).toBe(false)
  })
})

describe('Formatierung', () => {
  it('Datumsbereich', () => {
    expect(formatDateRange({ start_date: '2026-10-18', end_date: '2026-10-25' })).toBe('18. Okt. 2026 – 25. Okt. 2026')
  })
  it('vergangene Zeit', () => {
    const now = Date.parse('2026-10-18T12:00:00Z')
    expect(timeAgo('2026-10-18T11:59:40Z', now)).toBe('gerade eben')
    expect(timeAgo('2026-10-18T11:55:00Z', now)).toBe('vor 5 Min.')
    expect(timeAgo('2026-10-18T09:00:00Z', now)).toBe('vor 3 Std.')
  })
})
