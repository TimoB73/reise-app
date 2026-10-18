import { useState } from 'react'
import { KIND_INFO, type PoiKind } from '../lib/poi'

interface Props {
  kinds: PoiKind[]
  partnerName?: string
  showSaved: boolean
}

export const ME_COLOR = '#2563eb'
export const PARTNER_COLOR = '#f97316'
export const SAVED_RING = '#fbbf24'

function Dot({ color, ring }: { color: string; ring?: string }) {
  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 0 2px ${ring ?? '#ffffff'}` }}
      aria-hidden
    />
  )
}

/** Aufklappbare Farblegende unten links auf der Karte. */
export default function MapLegend({ kinds, partnerName, showSaved }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="absolute bottom-6 left-2 z-[1000] max-w-[70%] text-xs">
      {open ? (
        <div className="rounded-xl bg-white/95 p-3 text-slate-800 shadow-lg dark:bg-slate-900/95 dark:text-slate-100">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="font-semibold">Legende</span>
            <button type="button" onClick={() => setOpen(false)} className="-m-2 p-2 text-base leading-none" aria-label="Legende schließen">
              ✕
            </button>
          </div>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <Dot color={ME_COLOR} /> Du
            </li>
            {partnerName && (
              <li className="flex items-center gap-2">
                <Dot color={PARTNER_COLOR} /> {partnerName}
              </li>
            )}
            {kinds.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <Dot color={KIND_INFO[k].color} /> {KIND_INFO[k].label}
              </li>
            ))}
            {showSaved && (
              <li className="flex items-center gap-2">
                <Dot color="#94a3b8" ring={SAVED_RING} /> Gemerkt
              </li>
            )}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-white/95 px-3 font-medium text-slate-800 shadow-lg dark:bg-slate-900/95 dark:text-slate-100"
        >
          <span className="flex -space-x-1" aria-hidden>
            {kinds.slice(0, 3).map((k) => (
              <Dot key={k} color={KIND_INFO[k].color} />
            ))}
          </span>
          Legende
        </button>
      )}
    </div>
  )
}
