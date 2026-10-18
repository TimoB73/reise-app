import { useEffect, useState } from 'react'

/** Aktuelle Zeit, minütlich aktualisiert (für „jetzt geöffnet“). */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
