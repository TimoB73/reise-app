import { createStore, del, get, set } from 'idb-keyval'

interface Entry<T> {
  ts: number
  data: T
}

export const HOUR = 3_600_000
export const DAY = 24 * HOUR

let store: ReturnType<typeof createStore> | null = null
const memory = new Map<string, Entry<unknown>>()

function idb() {
  if (typeof indexedDB === 'undefined') return null
  try {
    store ??= createStore('reise-app', 'cache')
    return store
  } catch {
    return null
  }
}

/** Liest einen Cache-Eintrag; abgelaufene Einträge zählen als nicht vorhanden. */
export async function cacheGet<T>(key: string, ttlMs: number): Promise<T | undefined> {
  let entry = memory.get(key) as Entry<T> | undefined
  if (!entry) {
    const s = idb()
    if (s) {
      try {
        entry = await get<Entry<T>>(key, s)
      } catch {
        entry = undefined
      }
    }
  }
  if (!entry) return undefined
  if (Date.now() - entry.ts > ttlMs) {
    memory.delete(key)
    return undefined
  }
  memory.set(key, entry)
  return entry.data
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  const entry: Entry<T> = { ts: Date.now(), data }
  memory.set(key, entry)
  const s = idb()
  if (!s) return
  try {
    await set(key, entry, s)
  } catch {
    // Speicher voll oder privater Modus – Speicher-Cache reicht dann.
  }
}

export async function cacheDelete(key: string): Promise<void> {
  memory.delete(key)
  const s = idb()
  if (!s) return
  try {
    await del(key, s)
  } catch {
    // ignorieren
  }
}

/** Liefert den Cache-Wert oder lädt ihn neu. Gleichzeitige Anfragen für denselben Schlüssel werden zusammengelegt. */
const inflight = new Map<string, Promise<unknown>>()
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key, ttlMs)
  if (hit !== undefined) return hit
  const running = inflight.get(key) as Promise<T> | undefined
  if (running) return running
  const p = load()
    .then(async (data) => {
      await cacheSet(key, data)
      return data
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
