import { useMemo } from 'react'
import PoiCard from '../components/PoiCard'
import PoiExplorer from '../components/PoiExplorer'
import { useLocation } from '../context/LocationContext'
import { usePois, type PoiSource } from '../hooks/usePois'
import { fetchPois, walkHighlightsQuery } from '../lib/overpass'
import { isWalkHighlight, withDistance } from '../lib/poi'

const RADIUS = 2000

const source: PoiSource = {
  id: 'walk',
  radius: RADIUS,
  load: async (center, radius) => (await fetchPois(walkHighlightsQuery(center, radius))).filter((p) => isWalkHighlight(p.tags)),
}

export default function WalkHighlights() {
  const { position } = useLocation()
  const { status, pois, error, refresh } = usePois(source, position)
  const list = useMemo(() => (position ? withDistance(pois, position, RADIUS) : []), [pois, position])

  return (
    <PoiExplorer
      status={status}
      error={error}
      onRetry={refresh}
      pois={list}
      mode="walking"
      loadingLabel="Sehenswürdigkeiten werden gesucht …"
      emptyText="Im Umkreis von 2 km wurden keine Sehenswürdigkeiten gefunden."
      renderCard={(p) => <PoiCard key={p.id} poi={p} mode="walking" />}
    />
  )
}
