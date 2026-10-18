import { describe, expect, it } from 'vitest'
import { classify, cuisineLabel, cuisines, dedupe, isWalkHighlight, parseOverpass, withDistance, type Poi } from './poi'
import { mockOverpassFood, mockOverpassWalk } from '../test/mockData'

describe('classify', () => {
  it('erkennt Kategorien', () => {
    expect(classify({ tourism: 'museum' })).toBe('museum')
    expect(classify({ historic: 'castle' })).toBe('castle')
    expect(classify({ amenity: 'place_of_worship', religion: 'christian' })).toBe('church')
    expect(classify({ tourism: 'viewpoint' })).toBe('viewpoint')
    expect(classify({ historic: 'memorial' })).toBe('monument')
    expect(classify({ amenity: 'biergarten' })).toBe('biergarten')
    expect(classify({ shop: 'bakery' })).toBeNull()
  })
})

describe('isWalkHighlight', () => {
  it('filtert Stolpersteine und Grenzsteine ohne Wikidata', () => {
    expect(isWalkHighlight({ historic: 'memorial', memorial: 'stolperstein' })).toBe(false)
    expect(isWalkHighlight({ historic: 'boundary_stone' })).toBe(false)
  })
  it('behält alles mit Wikidata', () => {
    expect(isWalkHighlight({ historic: 'wayside_cross', wikidata: 'Q1' })).toBe(true)
  })
  it('behält Museen', () => {
    expect(isWalkHighlight({ tourism: 'museum' })).toBe(true)
  })
})

describe('parseOverpass', () => {
  it('liest Nodes und Ways (center) und verwirft Unbenanntes', () => {
    const pois = parseOverpass(mockOverpassWalk)
    const names = pois.map((p) => p.name)
    expect(names).toContain('Frauenkirche')
    expect(names).toContain('Deutsches Museum')
    expect(names).toContain('Aussichtspunkt') // unbenannter Aussichtspunkt bekommt Standardnamen
    expect(names).not.toContain('')
    const way = pois.find((p) => p.name === 'Deutsches Museum')!
    expect(way.id).toBe('way/2')
    expect(way.lat).toBeCloseTo(48.1299)
  })

  it('entfernt doppelte Einträge und bevorzugt den mit Wikidata', () => {
    const churches = parseOverpass(mockOverpassWalk).filter((p) => p.name === 'Frauenkirche')
    expect(churches).toHaveLength(1)
    expect(churches[0].tags.wikidata).toBe('Q167193')
  })

  it('liest Restaurants', () => {
    const pois = parseOverpass(mockOverpassFood)
    expect(pois.map((p) => p.kind).sort()).toEqual(['bar', 'biergarten', 'cafe', 'restaurant'])
  })
})

describe('dedupe', () => {
  it('behält gleichnamige Orte, die weit auseinander liegen', () => {
    const a: Poi = { id: 'node/1', name: 'Rathaus', kind: 'historic', lat: 48.1, lng: 11.5, tags: {} }
    const b: Poi = { ...a, id: 'node/2', lat: 48.2 }
    expect(dedupe([a, b])).toHaveLength(2)
  })
})

describe('withDistance', () => {
  it('sortiert nach Entfernung und schneidet bei maxMeters ab', () => {
    const pois = parseOverpass(mockOverpassWalk)
    const from = { lat: 48.13743, lng: 11.57549 }
    const list = withDistance(pois, from, 2000)
    for (let i = 1; i < list.length; i++) expect(list[i].distance).toBeGreaterThanOrEqual(list[i - 1].distance)
    expect(list.every((p) => p.distance <= 2000)).toBe(true)
    expect(list.find((p) => p.name === 'Schloss Nymphenburg')).toBeUndefined() // ~5 km entfernt
  })
})

describe('Küchen', () => {
  it('übersetzt bekannte Küchen und formatiert unbekannte', () => {
    expect(cuisineLabel('italian')).toBe('Italienisch')
    expect(cuisineLabel('fusion_food')).toBe('Fusion food')
  })
  it('liest mehrere Küchen und Diät-Tags', () => {
    expect(cuisines({ cuisine: 'pizza;italian', 'diet:vegan': 'yes' })).toEqual(['pizza', 'italian', 'vegan'])
  })
})
