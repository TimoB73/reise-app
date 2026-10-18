import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (online) return null
  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-slate-900">
      Keine Internetverbindung – angezeigt werden nur gespeicherte Daten.
    </div>
  )
}
