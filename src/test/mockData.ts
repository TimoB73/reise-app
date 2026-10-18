import type { OverpassResponse } from '../lib/poi'

/** Beispieldaten im Overpass-Format (München Innenstadt) für Tests und Vorschau. */
export const mockOverpassWalk: OverpassResponse = {
  elements: [
    {
      type: 'way',
      id: 1,
      center: { lat: 48.13864, lon: 11.57345 },
      tags: { amenity: 'place_of_worship', building: 'church', name: 'Frauenkirche', wikidata: 'Q167193', wikipedia: 'de:Frauenkirche (München)' },
    },
    { type: 'node', id: 11, lat: 48.13862, lon: 11.5735, tags: { amenity: 'place_of_worship', name: 'Frauenkirche' } },
    {
      type: 'way',
      id: 2,
      center: { lat: 48.1299, lon: 11.5834 },
      tags: { tourism: 'museum', name: 'Deutsches Museum', wikidata: 'Q32450', wikipedia: 'de:Deutsches Museum', opening_hours: 'Mo-Su 09:00-17:00' },
    },
    { type: 'node', id: 3, lat: 48.1374, lon: 11.5755, tags: { historic: 'memorial', memorial: 'stolperstein', name: 'Stolperstein' } },
    { type: 'node', id: 4, lat: 48.1351, lon: 11.5762, tags: { tourism: 'viewpoint' } },
    { type: 'node', id: 5, lat: 48.1366, lon: 11.5762, tags: { tourism: 'artwork', name: 'Fischbrunnen', wikidata: 'Q1419452' } },
    { type: 'node', id: 6, lat: 48.1373, lon: 11.5761, tags: { tourism: 'artwork' } },
    {
      type: 'way',
      id: 7,
      center: { lat: 48.1582, lon: 11.5033 },
      tags: { historic: 'castle', name: 'Schloss Nymphenburg', wikidata: 'Q156236' },
    },
    { type: 'node', id: 8, lat: 48.1372, lon: 11.5778, tags: { tourism: 'attraction', name: 'Altes Rathaus', historic: 'building', wikidata: 'Q264163' } },
  ],
}

export const mockOverpassFood: OverpassResponse = {
  elements: [
    {
      type: 'node',
      id: 101,
      lat: 48.1376,
      lon: 11.5799,
      tags: { amenity: 'restaurant', name: 'Hofbräuhaus', cuisine: 'bavarian;german', opening_hours: 'Mo-Su 11:00-24:00', wikidata: 'Q259045' },
    },
    { type: 'node', id: 102, lat: 48.1355, lon: 11.5765, tags: { amenity: 'biergarten', name: 'Viktualienmarkt Biergarten', opening_hours: 'Mo-Sa 10:00-22:00' } },
    { type: 'node', id: 103, lat: 48.1389, lon: 11.5741, tags: { amenity: 'cafe', name: 'Café Kreutzkamm', cuisine: 'cake;coffee_shop', 'diet:vegetarian': 'yes' } },
    { type: 'node', id: 104, lat: 48.1401, lon: 11.5788, tags: { amenity: 'bar', name: 'Schumann’s', opening_hours: 'Mo-Fr 17:00-03:00; Sa 18:00-03:00' } },
    { type: 'node', id: 105, lat: 48.14, lon: 11.57, tags: { amenity: 'restaurant' } },
  ],
}
