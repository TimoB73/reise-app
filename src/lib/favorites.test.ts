import { beforeEach, describe, expect, it, vi } from 'vitest'

const poi = { id: 'node/1', name: 'Dom', kind: 'church' as const, lat: 48.1, lng: 11.5 }

// localStorage-Ersatz für die Node-Testumgebung
const mem = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
})

async function load() {
  vi.resetModules()
  return import('./favorites')
}

describe('Favoriten', () => {
  beforeEach(() => mem.clear())

  it('merkt lokal und speichert im Gerät', async () => {
    const f = await load()
    await f.toggleFavorite(poi, 'saved')
    expect(f.favoritesFor(f.getFavoritesSnapshot(), 'node/1').mine?.saved).toBe(true)
    expect(JSON.parse(mem.get('reise-app:favorites:v2')!)).toHaveLength(1)
    expect(f.localFavorites()[0]).toMatchObject({ poiId: 'node/1', saved: true, visited: false })
  })

  it('übernimmt Favoriten aus Phase 2', async () => {
    mem.set(
      'reise-app:favorites:v1',
      JSON.stringify({ 'node/1': { poi, saved: true, visited: true, updatedAt: 1700000000000 } }),
    )
    const f = await load()
    expect(f.localFavorites()[0]).toMatchObject({ poiId: 'node/1', saved: true, visited: true, userId: 'local' })
  })

  it('trennt eigene Einträge und die des Partners', async () => {
    const f = await load()
    const save = vi.fn(async () => undefined)
    f.switchToRemote({ userId: 'me', readOnly: false, save }, [
      { poiId: 'node/1', userId: 'partner', name: 'Dom', kind: 'church', lat: 1, lng: 2, saved: true, visited: false, updatedAt: '2026-01-01' },
    ])
    await f.toggleFavorite(poi, 'visited')
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'me', poiId: 'node/1', visited: true, saved: false }))
    f.applyRemoteRecord({ poiId: 'node/2', userId: 'partner', name: 'X', kind: 'museum', lat: 1, lng: 2, saved: true, visited: false, updatedAt: '2026-01-02' })
    const { mine, others } = f.favoritesFor(f.getFavoritesSnapshot(), 'node/1')
    expect(mine?.visited).toBe(true)
    expect(others).toHaveLength(1)
    expect(others[0].userId).toBe('partner')
  })

  it('macht die Änderung rückgängig, wenn das Speichern fehlschlägt', async () => {
    const f = await load()
    f.switchToRemote({ userId: 'me', readOnly: false, save: async () => Promise.reject(new Error('Keine Verbindung')) }, [])
    await f.toggleFavorite(poi, 'saved')
    const s = f.getFavoritesSnapshot()
    expect(f.favoritesFor(s, 'node/1').mine).toBeUndefined()
    expect(s.error).toBe('Keine Verbindung')
  })

  it('ignoriert Klicks in archivierten Reisen', async () => {
    const f = await load()
    const save = vi.fn(async () => undefined)
    f.switchToRemote({ userId: 'me', readOnly: true, save }, [])
    await f.toggleFavorite(poi, 'saved')
    expect(save).not.toHaveBeenCalled()
  })
})
