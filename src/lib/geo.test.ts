import { describe, expect, it } from 'vitest'
import { distanceMeters, formatDistance, formatDuration, walkingMinutes } from './geo'

describe('distanceMeters', () => {
  it('ist 0 für denselben Punkt', () => {
    expect(distanceMeters({ lat: 48.1, lng: 11.5 }, { lat: 48.1, lng: 11.5 })).toBe(0)
  })

  it('berechnet Marienplatz → Frauenkirche München (~210 m)', () => {
    const d = distanceMeters({ lat: 48.13743, lng: 11.57549 }, { lat: 48.13864, lng: 11.57345 })
    expect(d).toBeGreaterThan(190)
    expect(d).toBeLessThan(230)
  })

  it('berechnet Berlin → Paris (~878 km)', () => {
    const d = distanceMeters({ lat: 52.52, lng: 13.405 }, { lat: 48.8566, lng: 2.3522 })
    expect(d / 1000).toBeCloseTo(878, -1)
  })
})

describe('walkingMinutes', () => {
  it('mindestens 1 Minute', () => {
    expect(walkingMinutes(0)).toBe(1)
  })

  it('1 km Luftlinie ≈ 17 Minuten (mit Umwegfaktor)', () => {
    expect(walkingMinutes(1000)).toBe(17)
  })
})

describe('Formatierung', () => {
  it('formatiert Distanzen', () => {
    expect(formatDistance(347)).toBe('350 m')
    expect(formatDistance(1500)).toBe('1,5 km')
  })

  it('formatiert Dauer', () => {
    expect(formatDuration(45)).toBe('45 Min.')
    expect(formatDuration(60)).toBe('1 Std.')
    expect(formatDuration(95)).toBe('1 Std. 35 Min.')
  })
})
