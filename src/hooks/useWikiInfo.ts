import { useEffect, useState } from 'react'
import { imageFromTags, wikiInfo, type WikiInfo } from '../lib/wiki'

/** Lädt Wikipedia-Kurzbeschreibung und Bild, sobald `enabled` true wird. */
export function useWikiInfo(tags: Record<string, string>, enabled: boolean) {
  const hasWiki = Boolean(tags.wikidata || tags.wikipedia)
  const [info, setInfo] = useState<WikiInfo>(() => ({ image: imageFromTags(tags) }))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !hasWiki) return
    let cancelled = false
    setLoading(true)
    wikiInfo(tags)
      .then((i) => !cancelled && setInfo((prev) => ({ ...i, image: i.image ?? prev.image })))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [enabled, hasWiki, tags.wikidata, tags.wikipedia])

  return { info, loading }
}
