import type { LatLng } from './geo'

export type TravelMode = 'walking' | 'driving'

export function isAppleDevice(ua = navigator.userAgent, platform = navigator.platform, touchPoints = navigator.maxTouchPoints): boolean {
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS meldet sich als Mac, hat aber einen Touchscreen
  return platform === 'MacIntel' && touchPoints > 1
}

export function navigationUrl(dest: LatLng, mode: TravelMode, apple: boolean): string {
  const ll = `${dest.lat.toFixed(6)},${dest.lng.toFixed(6)}`
  if (apple) return `https://maps.apple.com/?daddr=${ll}&dirflg=${mode === 'walking' ? 'w' : 'd'}`
  return `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=${mode}`
}
