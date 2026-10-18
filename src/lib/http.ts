import { AppError } from './errors'

export interface FetchOptions extends RequestInit {
  timeoutMs?: number
  /** Name des Dienstes für Fehlermeldungen, z. B. „Wikipedia“. */
  service: string
}

export async function fetchJson<T>(url: string, { timeoutMs = 15000, service, ...init }: FetchOptions): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new AppError('Keine Internetverbindung.')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted) throw new AppError(`${service} antwortet nicht rechtzeitig. Bitte später erneut versuchen.`)
    throw new AppError(`${service} ist nicht erreichbar. Bitte Internetverbindung prüfen.`)
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 429) throw new AppError(`Zu viele Anfragen an ${service}. Bitte kurz warten und erneut versuchen.`)
  if (res.status === 404) throw new AppError(`${service}: Eintrag nicht gefunden.`, false)
  if (res.status >= 500) throw new AppError(`${service} ist gerade überlastet. Bitte in einer Minute erneut versuchen.`)
  if (!res.ok) throw new AppError(`${service} meldet einen Fehler (${res.status}).`)
  return (await res.json()) as T
}
