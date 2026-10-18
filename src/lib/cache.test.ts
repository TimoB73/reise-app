import 'fake-indexeddb/auto'
import { describe, expect, it, vi } from 'vitest'
import { cached, cacheGet, cacheSet } from './cache'

describe('cache', () => {
  it('speichert und liest Werte', async () => {
    await cacheSet('a', { x: 1 })
    expect(await cacheGet('a', 1000)).toEqual({ x: 1 })
  })

  it('verwirft abgelaufene Einträge', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    await cacheSet('b', 42)
    vi.setSystemTime(Date.now() + 5000)
    expect(await cacheGet('b', 1000)).toBeUndefined()
    vi.useRealTimers()
  })

  it('lädt nur einmal bei gleichzeitigen Anfragen', async () => {
    const load = vi.fn(async () => 'daten')
    const [r1, r2] = await Promise.all([cached('c', 1000, load), cached('c', 1000, load)])
    expect(r1).toBe('daten')
    expect(r2).toBe('daten')
    expect(load).toHaveBeenCalledTimes(1)
    expect(await cached('c', 1000, load)).toBe('daten')
    expect(load).toHaveBeenCalledTimes(1)
  })
})
