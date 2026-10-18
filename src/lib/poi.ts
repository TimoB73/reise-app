import { distanceMeters, type LatLng } from './geo'

export type PoiKind =
  | 'museum'
  | 'viewpoint'
  | 'artwork'
  | 'castle'
  | 'church'
  | 'monument'
  | 'ruins'
  | 'archaeological'
  | 'attraction'
  | 'historic'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'pub'
  | 'biergarten'

export interface Poi extends LatLng {
  /** OSM-Typ und -ID, z. B. „node/123“. */
  id: string
  name: string
  kind: PoiKind
  tags: Record<string, string>
}

export interface PoiWithDistance extends Poi {
  distance: number
}

// Farben: klar unterscheidbar und nie Blau (= du) oder Orange (= Partner)
export const KIND_INFO: Record<PoiKind, { icon: string; label: string; color: string }> = {
  museum: { icon: '🏛️', label: 'Museum', color: '#7e22ce' },
  viewpoint: { icon: '🔭', label: 'Aussichtspunkt', color: '#16a34a' },
  artwork: { icon: '🎨', label: 'Kunstwerk', color: '#db2777' },
  castle: { icon: '🏰', label: 'Burg / Schloss', color: '#b91c1c' },
  church: { icon: '⛪', label: 'Kirche', color: '#0f766e' },
  monument: { icon: '🗿', label: 'Denkmal', color: '#64748b' },
  ruins: { icon: '🧱', label: 'Ruine', color: '#78350f' },
  archaeological: { icon: '⛏️', label: 'Ausgrabungsstätte', color: '#a16207' },
  attraction: { icon: '⭐', label: 'Sehenswürdigkeit', color: '#06b6d4' },
  historic: { icon: '📜', label: 'Historischer Ort', color: '#1e293b' },
  restaurant: { icon: '🍽️', label: 'Restaurant', color: '#dc2626' },
  cafe: { icon: '☕', label: 'Café', color: '#a16207' },
  bar: { icon: '🍸', label: 'Bar', color: '#7e22ce' },
  pub: { icon: '🍺', label: 'Kneipe', color: '#0f766e' },
  biergarten: { icon: '🌳', label: 'Biergarten', color: '#16a34a' },
}

const FOOD_KINDS = new Set(['restaurant', 'cafe', 'bar', 'pub', 'biergarten'])
const CHURCH_BUILDINGS = new Set(['church', 'cathedral', 'chapel', 'basilica'])

export function classify(tags: Record<string, string>): PoiKind | null {
  const amenity = tags.amenity
  if (amenity && FOOD_KINDS.has(amenity)) return amenity as PoiKind
  const tourism = tags.tourism
  const historic = tags.historic
  if (tourism === 'museum') return 'museum'
  if (historic === 'castle' || historic === 'palace' || tags.building === 'castle') return 'castle'
  if (amenity === 'place_of_worship' || CHURCH_BUILDINGS.has(tags.building ?? '') || historic === 'church') return 'church'
  if (tourism === 'viewpoint') return 'viewpoint'
  if (historic === 'ruins') return 'ruins'
  if (historic === 'archaeological_site') return 'archaeological'
  if (historic === 'monument' || historic === 'memorial') return 'monument'
  if (tourism === 'artwork') return 'artwork'
  if (tourism === 'attraction') return 'attraction'
  if (historic) return 'historic'
  return null
}

/** Kleinteilige historische Objekte, die ohne Wikidata-Eintrag die Liste nur füllen würden. */
const MINOR_HISTORIC = new Set([
  'boundary_stone',
  'wayside_cross',
  'wayside_shrine',
  'milestone',
  'tomb',
  'grave',
  'district',
  'yes',
  'building',
  'house',
  'tree_shrine',
  'cannon',
  'charcoal_pile',
])
const MINOR_MEMORIALS = new Set(['stolperstein', 'plaque', 'blue_plaque', 'ghost_bike', 'bench', 'stone'])

/** Ist ein Objekt für „Highlights zu Fuß“ relevant genug? */
export function isWalkHighlight(tags: Record<string, string>): boolean {
  if (tags.wikidata || tags.wikipedia) return true
  if (tags.historic && MINOR_HISTORIC.has(tags.historic)) return false
  if (tags.historic === 'memorial' && MINOR_MEMORIALS.has(tags.memorial ?? '')) return false
  // Kirchen ohne Wikidata sind meist unbedeutend (Gemeindehäuser, Kapellen in Kliniken …)
  if (tags.amenity === 'place_of_worship' && !tags.tourism && !tags.historic) return false
  return true
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export interface OverpassResponse {
  elements: OverpassElement[]
  remark?: string
}

export function parseOverpass(json: OverpassResponse): Poi[] {
  const pois: Poi[] = []
  for (const el of json.elements) {
    const tags = el.tags ?? {}
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat === undefined || lng === undefined) continue
    const kind = classify(tags)
    if (!kind) continue
    const name = tags['name:de'] || tags.name || (kind === 'viewpoint' ? 'Aussichtspunkt' : '')
    if (!name) continue
    pois.push({ id: `${el.type}/${el.id}`, name, kind, lat, lng, tags })
  }
  return dedupe(pois)
}

/** Entfernt Doppelungen (z. B. Kirche als Gebäude und als Punkt) – der Eintrag mit Wikidata gewinnt. */
export function dedupe(pois: Poi[]): Poi[] {
  const result: Poi[] = []
  const score = (p: Poi) => (p.tags.wikidata ? 2 : 0) + (p.tags.wikipedia ? 1 : 0)
  for (const p of pois) {
    const dup = result.findIndex(
      (q) =>
        (p.tags.wikidata && q.tags.wikidata === p.tags.wikidata) ||
        (q.name.toLowerCase() === p.name.toLowerCase() && distanceMeters(p, q) < 150),
    )
    if (dup === -1) result.push(p)
    else if (score(p) > score(result[dup])) result[dup] = p
  }
  return result
}

export function withDistance(pois: Poi[], from: LatLng, maxMeters = Infinity): PoiWithDistance[] {
  return pois
    .map((p) => ({ ...p, distance: distanceMeters(from, p) }))
    .filter((p) => p.distance <= maxMeters)
    .sort((a, b) => a.distance - b.distance)
}

const CUISINE_DE: Record<string, string> = {
  african: 'Afrikanisch',
  american: 'Amerikanisch',
  arab: 'Arabisch',
  asian: 'Asiatisch',
  austrian: 'Österreichisch',
  balkan: 'Balkan',
  barbecue: 'Grill',
  bavarian: 'Bayerisch',
  breakfast: 'Frühstück',
  burger: 'Burger',
  cake: 'Kuchen',
  chicken: 'Hähnchen',
  chinese: 'Chinesisch',
  coffee_shop: 'Kaffee',
  crepe: 'Crêpes',
  croatian: 'Kroatisch',
  donut: 'Donuts',
  fish: 'Fisch',
  fish_and_chips: 'Fish & Chips',
  french: 'Französisch',
  georgian: 'Georgisch',
  german: 'Deutsch',
  greek: 'Griechisch',
  ice_cream: 'Eis',
  indian: 'Indisch',
  international: 'International',
  italian: 'Italienisch',
  japanese: 'Japanisch',
  kebab: 'Döner & Kebab',
  korean: 'Koreanisch',
  lebanese: 'Libanesisch',
  mediterranean: 'Mediterran',
  mexican: 'Mexikanisch',
  middle_eastern: 'Orientalisch',
  noodle: 'Nudeln',
  persian: 'Persisch',
  pizza: 'Pizza',
  portuguese: 'Portugiesisch',
  ramen: 'Ramen',
  regional: 'Regional',
  russian: 'Russisch',
  sandwich: 'Sandwiches',
  seafood: 'Meeresfrüchte',
  spanish: 'Spanisch',
  steak_house: 'Steakhaus',
  sushi: 'Sushi',
  swiss: 'Schweizerisch',
  syrian: 'Syrisch',
  tapas: 'Tapas',
  thai: 'Thailändisch',
  turkish: 'Türkisch',
  vegan: 'Vegan',
  vegetarian: 'Vegetarisch',
  vietnamese: 'Vietnamesisch',
}

export function cuisineLabel(code: string): string {
  const c = code.trim().toLowerCase()
  if (CUISINE_DE[c]) return CUISINE_DE[c]
  const text = c.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Küchen-Codes eines Lokals, inkl. vegetarisch/vegan aus den diet:*-Tags. */
export function cuisines(tags: Record<string, string>): string[] {
  const list = (tags.cuisine ?? '')
    .split(/[;,]/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
  if (['yes', 'only'].includes(tags['diet:vegan'] ?? '') && !list.includes('vegan')) list.push('vegan')
  if (['yes', 'only'].includes(tags['diet:vegetarian'] ?? '') && !list.includes('vegetarian')) list.push('vegetarian')
  return list
}
