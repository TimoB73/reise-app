import { AppError } from './errors'
import { parseOverpass, type OverpassResponse, type Poi } from './poi'
import type { LatLng } from './geo'

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

async function runQuery(query: string): Promise<OverpassResponse> {
  if (!navigator.onLine) throw new AppError('Keine Internetverbindung.')
  let lastError: AppError | null = null
  for (const url of ENDPOINTS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 35000)
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      })
      if (res.status === 429) {
        lastError = new AppError('Der Kartendienst bekommt gerade zu viele Anfragen. Bitte eine Minute warten und erneut versuchen.')
        continue
      }
      if (!res.ok) {
        lastError = new AppError('Der Kartendienst ist gerade überlastet. Bitte in einer Minute erneut versuchen.')
        continue
      }
      const json = (await res.json()) as OverpassResponse
      if (json.remark && /runtime error|timed out|out of memory/i.test(json.remark)) {
        lastError = new AppError('Die Suche hat zu lange gedauert. Bitte später erneut versuchen.')
        continue
      }
      return json
    } catch {
      lastError = controller.signal.aborted
        ? new AppError('Der Kartendienst antwortet nicht rechtzeitig. Bitte später erneut versuchen.')
        : new AppError('Der Kartendienst ist nicht erreichbar. Bitte Internetverbindung prüfen.')
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError ?? new AppError('Der Kartendienst ist nicht erreichbar.')
}

const around = (r: number, c: LatLng) => `around:${Math.round(r)},${c.lat.toFixed(6)},${c.lng.toFixed(6)}`

export function walkHighlightsQuery(center: LatLng, radius: number): string {
  const a = around(radius, center)
  return `[out:json][timeout:25];
(
  nwr(${a})["tourism"~"^(attraction|museum|artwork)$"]["name"];
  nwr(${a})["tourism"="viewpoint"];
  nwr(${a})["historic"]["name"];
  nwr(${a})["amenity"="place_of_worship"]["wikidata"];
  nwr(${a})["building"~"^(church|cathedral|chapel|basilica|castle)$"]["wikidata"];
);
out center tags qt;`
}

export function foodQuery(center: LatLng, radius: number): string {
  return `[out:json][timeout:25];
nwr(${around(radius, center)})["amenity"~"^(restaurant|bar|pub|cafe|biergarten)$"]["name"];
out center tags qt;`
}

export async function fetchPois(query: string): Promise<Poi[]> {
  return parseOverpass(await runQuery(query))
}
