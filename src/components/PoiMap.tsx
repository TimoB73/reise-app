import 'leaflet/dist/leaflet.css'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet'
import { useTrip } from '../context/TripContext'
import { useNow } from '../hooks/useNow'
import { favoritesFor, useFavoritesSnapshot } from '../lib/favorites'
import { distanceMeters, formatDistance, formatDuration, walkingMinutes, type LatLng } from '../lib/geo'
import type { TravelMode } from '../lib/navigation'
import { KIND_INFO, type PoiKind, type PoiWithDistance } from '../lib/poi'
import { isPositionFresh, timeAgo } from '../lib/trip'
import FavoriteButtons from './FavoriteButtons'
import MapLegend, { ME_COLOR, PARTNER_COLOR, SAVED_RING } from './MapLegend'

interface Props {
  pois: PoiWithDistance[]
  center: LatLng
  accuracy: number | null
  mode: TravelMode
  zoom?: number
}

export default function PoiMap({ pois, center, accuracy, mode, zoom = 15 }: Props) {
  const { partner, partnerPosition } = useTrip()
  const snapshot = useFavoritesSnapshot()
  const now = useNow(30_000).getTime()
  const partnerPos = isPositionFresh(partnerPosition, now) ? partnerPosition : null
  const kinds = [...new Set(pois.map((p) => p.kind))].sort((a, b) => KIND_INFO[a].label.localeCompare(KIND_INFO[b].label)) as PoiKind[]
  const isSaved = (id: string) => {
    const { mine, others } = favoritesFor(snapshot, id)
    return Boolean(mine?.saved || others.some((o) => o.saved))
  }
  const anySaved = pois.some((p) => isSaved(p.id))

  return (
    <div className="relative h-[calc(100dvh-13rem)] min-h-80 overflow-hidden rounded-2xl shadow-sm">
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} preferCanvas className="h-full w-full">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
          maxZoom={19}
        />
        {accuracy && accuracy < 500 && (
          <Circle center={[center.lat, center.lng]} radius={accuracy} pathOptions={{ color: ME_COLOR, weight: 1, fillOpacity: 0.1 }} />
        )}
        {pois.map((p) => {
          const saved = isSaved(p.id)
          return (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={saved ? 10 : 9}
              pathOptions={{ color: saved ? SAVED_RING : '#ffffff', weight: saved ? 4 : 2, fillColor: KIND_INFO[p.kind].color, fillOpacity: 0.95 }}
            >
              <Popup>
                <div className="w-56 space-y-2">
                  <p className="text-base font-semibold">
                    {KIND_INFO[p.kind].icon} {p.name}
                  </p>
                  <p className="!m-0 text-slate-600">
                    {KIND_INFO[p.kind].label} · {formatDistance(p.distance)} · 🚶 {formatDuration(walkingMinutes(p.distance))}
                  </p>
                  <FavoriteButtons poi={p} mode={mode} compact />
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        {partner && partnerPos && (
          <CircleMarker
            center={[partnerPos.lat, partnerPos.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: PARTNER_COLOR, fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent>
              {partner.display_name}
            </Tooltip>
            <Popup>
              {partner.display_name} · {formatDistance(distanceMeters(center, partnerPos))} entfernt · {timeAgo(partnerPos.updated_at, now)}
            </Popup>
          </CircleMarker>
        )}
        <CircleMarker center={[center.lat, center.lng]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: ME_COLOR, fillOpacity: 1 }}>
          <Popup>Dein Standort</Popup>
        </CircleMarker>
      </MapContainer>
      <MapLegend kinds={kinds} partnerName={partnerPos ? partner?.display_name : undefined} showSaved={anySaved} />
    </div>
  )
}
