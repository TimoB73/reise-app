import { cached, DAY } from './cache'
import { fetchJson } from './http'

export interface WikiInfo {
  extract?: string
  image?: string
  url?: string
}

/** Zerlegt einen OSM-wikipedia-Tag wie „de:Frauenkirche (München)“. */
export function parseWikipediaTag(tag: string | undefined): { lang: string; title: string } | null {
  if (!tag) return null
  const m = /^([a-z-]{2,12}):(.+)$/.exec(tag.trim())
  if (m) return { lang: m[1], title: m[2].trim() }
  return { lang: 'de', title: tag.trim() }
}

const ABBREVIATIONS = new Set([
  'st', 'nr', 'bzw', 'ca', 'jh', 'jhd', 'chr', 'dr', 'prof', 'etc', 'evtl', 'ggf', 'inkl', 'vgl', 'sog', 'mio', 'mrd',
  'geb', 'gest', 'hl', 'mt', 'str', 'bzw', 'usw', 'v', 'n', 'u', 'z', 'b', 'a', 'o', 'd', 'h', 'e', 'i', 'w', 's',
  'mr', 'mrs', 'ms', 'jr', 'sr', 'vs', 'approx', 'no',
])

/** Die ersten n Sätze eines Textes; Abkürzungen („St.“, „z. B.“) und Ordnungszahlen („18. Jh.“) trennen keine Sätze. */
export function firstSentences(text: string, n = 2): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const re = /[.!?](?=\s+["„(]?[A-ZÄÖÜ0-9])/g
  let count = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(clean))) {
    if (clean[m.index] === '.') {
      const before = clean.slice(0, m.index)
      const word = /([\p{L}\d]+)$/u.exec(before)?.[1] ?? ''
      if (ABBREVIATIONS.has(word.toLowerCase()) || /^\d+$/.test(word)) continue
    }
    count++
    if (count === n) return clean.slice(0, m.index + 1)
  }
  return clean
}

export function commonsImageUrl(file: string, width = 400): string {
  const name = file.replace(/^(File|Datei|Image):/i, '').trim()
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`
}

interface Summary {
  type?: string
  extract?: string
  thumbnail?: { source: string }
  content_urls?: { mobile?: { page: string }; desktop?: { page: string } }
}

async function fetchSummary(lang: string, title: string): Promise<WikiInfo | null> {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
  try {
    const s = await fetchJson<Summary>(url, { service: 'Wikipedia' })
    if (s.type === 'disambiguation') return null
    return {
      extract: s.extract ? firstSentences(s.extract, 2) : undefined,
      image: s.thumbnail?.source,
      url: s.content_urls?.mobile?.page ?? s.content_urls?.desktop?.page,
    }
  } catch {
    return null
  }
}

interface EntityResponse {
  entities?: Record<string, { sitelinks?: Record<string, { title: string }> }>
}
interface ClaimsResponse {
  claims?: { P18?: { mainsnak?: { datavalue?: { value?: string } } }[] }
}

async function wikidataSitelinks(qid: string): Promise<Record<string, string>> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks&sitefilter=dewiki|enwiki&ids=${qid}`
  const r = await fetchJson<EntityResponse>(url, { service: 'Wikidata' })
  const links = r.entities?.[qid]?.sitelinks ?? {}
  return Object.fromEntries(Object.entries(links).map(([k, v]) => [k, v.title]))
}

async function wikidataImage(qid: string): Promise<string | undefined> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&origin=*&property=P18&entity=${qid}`
  const r = await fetchJson<ClaimsResponse>(url, { service: 'Wikidata' })
  const file = r.claims?.P18?.[0]?.mainsnak?.datavalue?.value
  return file ? commonsImageUrl(file) : undefined
}

/** Kurzbeschreibung und Bild zu einem OSM-Objekt (deutsche Wikipedia bevorzugt, sonst englisch). */
export async function wikiInfo(tags: Record<string, string>): Promise<WikiInfo> {
  const qid = /^Q\d+$/.test(tags.wikidata ?? '') ? tags.wikidata : undefined
  const tag = parseWikipediaTag(tags.wikipedia)
  const key = `wiki:${qid ?? tags.wikipedia ?? ''}`

  return cached(key, 14 * DAY, async () => {
    let article = tag
    if (qid && (!tag || tag.lang !== 'de')) {
      try {
        const links = await wikidataSitelinks(qid)
        if (links.dewiki) article = { lang: 'de', title: links.dewiki }
        else if (!article && links.enwiki) article = { lang: 'en', title: links.enwiki }
      } catch {
        // ohne Sitelinks weiter mit dem OSM-Tag
      }
    }
    const info: WikiInfo = (article && (await fetchSummary(article.lang, article.title))) || {}

    if (!info.image) {
      if (tags.wikimedia_commons?.startsWith('File:')) info.image = commonsImageUrl(tags.wikimedia_commons)
      else if (qid) info.image = await wikidataImage(qid).catch(() => undefined)
    }
    return info
  })
}

/** Bild direkt aus den OSM-Tags (ohne Netzabfrage), falls vorhanden. */
export function imageFromTags(tags: Record<string, string>): string | undefined {
  if (tags.wikimedia_commons?.startsWith('File:')) return commonsImageUrl(tags.wikimedia_commons)
  if (tags.image?.startsWith('File:')) return commonsImageUrl(tags.image)
  if (tags.image && /^https:\/\/upload\.wikimedia\.org\//.test(tags.image)) return tags.image
  return undefined
}
