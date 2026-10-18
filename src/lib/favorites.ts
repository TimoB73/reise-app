import { useSyncExternalStore } from 'react'
import type { Poi } from './poi'

/** Lokale Favoriten (Phase 2). In Phase 3 werden sie mit Supabase synchronisiert. */
export interface Favorite {
  poi: Pick<Poi, 'id' | 'name' | 'kind' | 'lat' | 'lng'>
  saved: boolean
  visited: boolean
  updatedAt: number
}

const KEY = 'reise-app:favorites:v1'
type FavMap = Record<string, Favorite>

let state: FavMap = load()
const listeners = new Set<() => void>()

function load(): FavMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as FavMap
  } catch {
    return {}
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Speicher nicht verfügbar – bleibt im Speicher
  }
  listeners.forEach((l) => l())
}

export function toggleFavorite(poi: Poi, field: 'saved' | 'visited') {
  const current = state[poi.id] ?? {
    poi: { id: poi.id, name: poi.name, kind: poi.kind, lat: poi.lat, lng: poi.lng },
    saved: false,
    visited: false,
    updatedAt: 0,
  }
  const next = { ...current, [field]: !current[field], updatedAt: Date.now() }
  const copy = { ...state }
  if (!next.saved && !next.visited) delete copy[poi.id]
  else copy[poi.id] = next
  state = copy
  save()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useFavorites(): FavMap {
  return useSyncExternalStore(subscribe, () => state)
}
