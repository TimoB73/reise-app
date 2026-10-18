import { describe, expect, it } from 'vitest'
import { commonsImageUrl, firstSentences, imageFromTags, parseWikipediaTag } from './wiki'

describe('parseWikipediaTag', () => {
  it('trennt Sprache und Titel', () => {
    expect(parseWikipediaTag('de:Frauenkirche (München)')).toEqual({ lang: 'de', title: 'Frauenkirche (München)' })
    expect(parseWikipediaTag('en:Big Ben')).toEqual({ lang: 'en', title: 'Big Ben' })
  })
  it('nimmt Deutsch an, wenn keine Sprache angegeben ist', () => {
    expect(parseWikipediaTag('Kölner Dom')).toEqual({ lang: 'de', title: 'Kölner Dom' })
  })
  it('liefert null ohne Tag', () => {
    expect(parseWikipediaTag(undefined)).toBeNull()
  })
})

describe('firstSentences', () => {
  it('schneidet nach zwei Sätzen ab', () => {
    expect(firstSentences('Satz eins. Satz zwei. Satz drei.')).toBe('Satz eins. Satz zwei.')
  })
  it('trennt nicht bei Abkürzungen und Ordnungszahlen', () => {
    const text = 'Die Kirche St. Peter wurde im 12. Jahrhundert gebaut, z. B. mit Tuff. Sie ist alt. Noch mehr.'
    expect(firstSentences(text)).toBe('Die Kirche St. Peter wurde im 12. Jahrhundert gebaut, z. B. mit Tuff. Sie ist alt.')
  })
  it('gibt kurze Texte unverändert zurück', () => {
    expect(firstSentences('Nur ein Satz.')).toBe('Nur ein Satz.')
  })
})

describe('Bilder', () => {
  it('baut Commons-URLs', () => {
    expect(commonsImageUrl('File:Frauenkirche Munich.jpg')).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/Frauenkirche%20Munich.jpg?width=400',
    )
  })
  it('liest Bilder aus OSM-Tags', () => {
    expect(imageFromTags({ wikimedia_commons: 'File:A.jpg' })).toContain('Special:FilePath/A.jpg')
    expect(imageFromTags({ image: 'http://example.com/x.jpg' })).toBeUndefined()
  })
})
