import { useCallback, useEffect, useState } from 'react'
import { cacheDelete, cached, DAY } from '../lib/cache'
import { userMessage } from '../lib/errors'
import { CELL_MAX_OFFSET_M, gridCell, type LatLng } from '../lib/geo'
import type { Poi } from '../lib/poi'

export interface PoiSource {
  /** Eindeutiger Name für den Cache, z. B. „walk“. */
  id: string
  radius: number
  load: (center: LatLng, radius: number) => Promise<Poi[]>
}

interface State {
  status: 'idle' | 'loading' | 'ready' | 'error'
  pois: Poi[]
  error: string | null
}

/**
 * Lädt POIs für die ~500-m-Zelle der aktuellen Position. Abgefragt wird um den Zellmittelpunkt
 * mit etwas größerem Radius, damit das Ergebnis für jede Position in der Zelle vollständig ist.
 */
export function usePois(source: PoiSource, position: LatLng | null) {
  const [state, setState] = useState<State>({ status: 'idle', pois: [], error: null })
  const [reload, setReload] = useState(0)
  const cell = position ? gridCell(position) : null
  const cellKey = cell?.key

  useEffect(() => {
    if (!cell) return
    let cancelled = false
    const key = `pois:${source.id}:${cell.key}`
    setState((s) => ({ ...s, status: 'loading', error: null }))
    // kurze Verzögerung: verhindert Anfragen, wenn die Position gerade über eine Zellgrenze springt
    const timer = setTimeout(() => {
      cached(key, DAY, () => source.load(cell.center, source.radius + CELL_MAX_OFFSET_M))
        .then((pois) => !cancelled && setState({ status: 'ready', pois, error: null }))
        .catch((err) => !cancelled && setState((s) => ({ ...s, status: 'error', error: userMessage(err) })))
    }, 600)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [cellKey, source.id, reload])

  const refresh = useCallback(async () => {
    if (cellKey) await cacheDelete(`pois:${source.id}:${cellKey}`)
    setReload((r) => r + 1)
  }, [cellKey, source.id])

  return { ...state, refresh }
}
