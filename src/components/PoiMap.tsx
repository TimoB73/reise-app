import 'leaflet/dist/leaflet.css'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { formatDistance, formatDuration, walkingMinutes, type LatLng } from '../lib/geo'
import type { TravelMode } from '../lib/navigation'
import { KIND_INFO, type PoiWithDistance } from '../lib/poi'
import FavoriteButtons from './FavoriteButtons'

interface Props {
  pois: PoiWithDistance[]
  center: LatLng
  accuracy: number | null
  mode: TravelMode
  zoom?: number
}

export default function PoiMap({ pois, center, accuracy, mode, zoom = 15 }: Props) {
  return (
    <div className="h-[calc(100dvh-13rem)] min-h-80 overflow-hidden rounded-2xl shadow-sm">
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} preferCanvas className="h-full w-full">
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
          maxZoom={19}
        />
        {accuracy && accuracy < 500 && (
          <Circle center={[center.lat, center.lng]} radius={accuracy} pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.1 }} />
        )}
        {pois.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: KIND_INFO[p.kind].color, fillOpacity: 0.95 }}
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
        ))}
        <CircleMarker center={[center.lat, center.lng]} radius={8} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}>
          <Popup>Dein Standort</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}
