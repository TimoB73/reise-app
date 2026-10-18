import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export default function QrCode({ text, size = 220 }: { text: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => setSrc(null))
    return () => {
      cancelled = true
    }
  }, [text, size])
  return (
    <div className="mx-auto rounded-xl bg-white p-2" style={{ width: size + 16, height: size + 16 }}>
      {src && <img src={src} width={size} height={size} alt="QR-Code zum Beitreten" />}
    </div>
  )
}
