import { describe, expect, it } from 'vitest'
import { isAppleDevice, navigationUrl } from './navigation'

describe('isAppleDevice', () => {
  it('erkennt iPhone und iPad', () => {
    expect(isAppleDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 'iPhone', 5)).toBe(true)
    expect(isAppleDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5)).toBe(true) // iPadOS
  })
  it('erkennt Android und Desktop-Mac als nicht Apple-Mobil', () => {
    expect(isAppleDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)', 'Linux armv8l', 5)).toBe(false)
    expect(isAppleDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0)).toBe(false)
  })
})

describe('navigationUrl', () => {
  const dest = { lat: 48.13864, lng: 11.57345 }
  it('baut Apple-Maps-Links', () => {
    expect(navigationUrl(dest, 'walking', true)).toBe('https://maps.apple.com/?daddr=48.138640,11.573450&dirflg=w')
    expect(navigationUrl(dest, 'driving', true)).toContain('dirflg=d')
  })
  it('baut Google-Maps-Links', () => {
    expect(navigationUrl(dest, 'walking', false)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=48.138640,11.573450&travelmode=walking',
    )
  })
})
