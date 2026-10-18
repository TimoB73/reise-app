import jsQR from 'jsqr'
import { useEffect, useRef, useState } from 'react'

interface Props {
  onResult: (text: string) => void
  onClose: () => void
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike
  }
}

/** Kamera-Scanner für QR-Codes (BarcodeDetector, wo verfügbar, sonst jsQR). */
export default function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef(onResult)
  resultRef.current = onResult

  useEffect(() => {
    let stream: MediaStream | null = null
    let frame = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null

    const scan = async () => {
      const video = videoRef.current
      if (stopped || !video || !ctx) return
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const scale = Math.min(1, 640 / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        let text: string | null = null
        if (detector) {
          try {
            text = (await detector.detect(canvas))[0]?.rawValue ?? null
          } catch {
            text = null
          }
        }
        if (!text) {
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
          text = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ?? null
        }
        if (text && !stopped) {
          stopped = true
          resultRef.current(text)
          return
        }
      }
      frame = requestAnimationFrame(() => void scan())
    }

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (s) => {
        if (stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        await video.play()
        void scan()
      })
      .catch((err: DOMException) => {
        setError(
          err?.name === 'NotAllowedError'
            ? 'Kamerazugriff wurde nicht erlaubt. Bitte in den Einstellungen freigeben oder den Code eintippen.'
            : 'Kamera konnte nicht gestartet werden. Bitte den Code eintippen.',
        )
      })
    if (!navigator.mediaDevices) setError('Dieses Gerät erlaubt hier keinen Kamerazugriff. Bitte den Code eintippen.')

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-black">
      <div className="safe-top flex items-center justify-between p-3 text-white">
        <span className="font-semibold">QR-Code scannen</span>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-white/20 px-4 font-medium">
          Abbrechen
        </button>
      </div>
      <div className="relative flex-1">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-60 w-60 rounded-3xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>
        {error && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-white p-4 text-center text-slate-900">{error}</div>
        )}
      </div>
      <p className="safe-bottom p-4 text-center text-sm text-white/80">Den QR-Code vom Handy deines Partners in den Rahmen halten.</p>
    </div>
  )
}
