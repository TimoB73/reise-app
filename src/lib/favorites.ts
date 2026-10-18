import { useSyncExternalStore } from 'react'
import type { Poi } from './poi'

/** „Gemerkt“ und „Besucht“ einer Person für einen Ort. */
export interface FavoriteRecord {
  poiId: string
  userId: string
  name: string
  kind: Poi['kind']
  lat: number
  lng: number
  saved: boolean
  visited: boolean
  updatedAt: string
}

/** Ziel, in das Änderungen geschrieben werden: lokal auf dem Gerät oder in die gemeinsame Reise. */
export interface FavoritesBackend {
  userId: string
  readOnly: boolean
  save: (rec: FavoriteRecord) => Promise<void>
}

interface Snapshot {
  records: Record<string, FavoriteRecord>
  myId: string
  readOnly: boolean
  /** Letzter Fehler beim Speichern (wird nach Anzeige zurückgesetzt). */
  error: string | null
}

export const LOCAL_USER = 'local'
const LOCAL_KEY = 'reise-app:favorites:v2'
const LEGACY_KEY = 'reise-app:favorites:v1'

const recordKey = (userId: string, poiId: string) => `${userId}|${poiId}`

function loadLocal(): FavoriteRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return JSON.parse(raw) as FavoriteRecord[]
    // Übernahme aus Phase 2
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '{}') as Record<
      string,
      { poi: Pick<Poi, 'id' | 'name' | 'kind' | 'lat' | 'lng'>; saved: boolean; visited: boolean; updatedAt: number }
    >
    return Object.values(legacy).map((f) => ({
      poiId: f.poi.id,
      userId: LOCAL_USER,
      name: f.poi.name,
      kind: f.poi.kind,
      lat: f.poi.lat,
      lng: f.poi.lng,
      saved: f.saved,
      visited: f.visited,
      updatedAt: new Date(f.updatedAt).toISOString(),
    }))
  } catch {
    return []
  }
}

function saveLocal(records: FavoriteRecord[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(records.filter((r) => r.saved || r.visited)))
  } catch {
    // Speicher nicht verfügbar
  }
}

const localBackend: FavoritesBackend = {
  userId: LOCAL_USER,
  readOnly: false,
  save: async () => saveLocal(Object.values(snapshot.records).filter((r) => r.userId === LOCAL_USER)),
}

const toMap = (list: FavoriteRecord[]) => Object.fromEntries(list.map((r) => [recordKey(r.userId, r.poiId), r]))

let backend: FavoritesBackend = localBackend
let snapshot: Snapshot = { records: toMap(loadLocal()), myId: LOCAL_USER, readOnly: false, error: null }
const listeners = new Set<() => void>()

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((l) => l())
}

/** Lokale Favoriten (ohne Reise), z. B. zum Übertragen in eine neue Reise. */
export function localFavorites(): FavoriteRecord[] {
  return loadLocal().filter((r) => r.saved || r.visited)
}

/** Wechselt zurück auf lokale Favoriten (keine Reise aktiv). */
export function switchToLocal() {
  backend = localBackend
  emit({ records: toMap(loadLocal()), myId: LOCAL_USER, readOnly: false, error: null })
}

/** Wechselt auf die gemeinsame Reise und ersetzt alle Einträge. */
export function switchToRemote(b: FavoritesBackend, records: FavoriteRecord[]) {
  backend = b
  emit({ records: toMap(records), myId: b.userId, readOnly: b.readOnly, error: null })
}

/** Übernimmt eine Änderung aus der Echtzeit-Synchronisierung (neuere gewinnt). */
export function applyRemoteRecord(rec: FavoriteRecord) {
  const key = recordKey(rec.userId, rec.poiId)
  const current = snapshot.records[key]
  if (current && current.updatedAt > rec.updatedAt && rec.userId === snapshot.myId) return
  emit({ records: { ...snapshot.records, [key]: rec } })
}

export function clearFavoritesError() {
  if (snapshot.error) emit({ error: null })
}

export async function toggleFavorite(poi: Pick<Poi, 'id' | 'name' | 'kind' | 'lat' | 'lng'>, field: 'saved' | 'visited') {
  if (snapshot.readOnly) return
  const key = recordKey(backend.userId, poi.id)
  const previous = snapshot.records[key]
  const base: FavoriteRecord = previous ?? {
    poiId: poi.id,
    userId: backend.userId,
    name: poi.name,
    kind: poi.kind,
    lat: poi.lat,
    lng: poi.lng,
    saved: false,
    visited: false,
    updatedAt: new Date(0).toISOString(),
  }
  const next: FavoriteRecord = { ...base, [field]: !base[field], updatedAt: new Date().toISOString() }
  emit({ records: { ...snapshot.records, [key]: next } }) // sofort anzeigen
  try {
    await backend.save(next)
  } catch (err) {
    const records = { ...snapshot.records }
    if (previous) records[key] = previous
    else delete records[key]
    emit({ records, error: err instanceof Error ? err.message : 'Speichern fehlgeschlagen.' })
  }
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getFavoritesSnapshot(): Snapshot {
  return snapshot
}

export function useFavoritesSnapshot(): Snapshot {
  return useSyncExternalStore(subscribe, getFavoritesSnapshot)
}

/** Eigener Eintrag und Einträge anderer Mitreisender für einen Ort. */
export function favoritesFor(s: Snapshot, poiId: string): { mine?: FavoriteRecord; others: FavoriteRecord[] } {
  let mine: FavoriteRecord | undefined
  const others: FavoriteRecord[] = []
  for (const r of Object.values(s.records)) {
    if (r.poiId !== poiId) continue
    if (r.userId === s.myId) mine = r
    else if (r.saved || r.visited) others.push(r)
  }
  return { mine, others }
}
