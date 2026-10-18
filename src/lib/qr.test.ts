import jsQR from 'jsqr'
import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import { joinUrl, parseJoinInput } from './trip'

/** Rendert einen QR-Code als RGBA-Bild (wie ein Kamerabild) und liest ihn mit jsQR zurück. */
function roundtrip(text: string): string | null {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const scale = 6
  const margin = 4
  const n = qr.modules.size
  const size = (n + margin * 2) * scale
  const data = new Uint8ClampedArray(size * size * 4).fill(255)
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (!qr.modules.get(y, x)) continue
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + margin) * scale + dy) * size + (x + margin) * scale + dx) * 4
          data[i] = data[i + 1] = data[i + 2] = 0
        }
    }
  return jsQR(data, size, size)?.data ?? null
}

describe('QR-Einladung', () => {
  it('erzeugter QR-Code wird gelesen und ergibt den Reise-Code', () => {
    const url = joinUrl('KX7P2M', 'https://timob73.github.io/reise-app/')
    const scanned = roundtrip(url)
    expect(scanned).toBe(url)
    expect(parseJoinInput(scanned!)).toBe('KX7P2M')
  })
})
