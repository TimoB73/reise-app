import { isConfigured } from '../lib/env'

const sources = [
  { name: 'OpenStreetMap', text: 'Kartendaten © OpenStreetMap-Mitwirkende, Lizenz ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { name: 'Overpass API', text: 'Abfrage von OSM-Daten', url: 'https://overpass-api.de/' },
  { name: 'Nominatim', text: 'Ortssuche und Adressen auf Basis von OpenStreetMap', url: 'https://nominatim.org/' },
  { name: 'openrouteservice', text: 'Erreichbarkeit und Fahrzeiten © openrouteservice.org by HeiGIT', url: 'https://openrouteservice.org/' },
  { name: 'Wikipedia', text: 'Texte unter CC BY-SA 4.0', url: 'https://de.wikipedia.org/' },
  { name: 'Wikidata', text: 'Daten unter CC0', url: 'https://www.wikidata.org/' },
  { name: 'Wikimedia Commons', text: 'Bilder unter den jeweils angegebenen freien Lizenzen', url: 'https://commons.wikimedia.org/' },
]

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center justify-between py-2">
      <span>{label}</span>
      <span className={ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
        {ok ? '✓ eingerichtet' : '✗ fehlt'}
      </span>
    </li>
  )
}

export default function Info() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Über die App</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Sightseeing-App für zwei Reisende. Version {__APP_VERSION__}.
        </p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Datenquellen & Lizenzen</h2>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {sources.map((s) => (
            <li key={s.name} className="py-3">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-brand-600 underline dark:text-brand-500">
                {s.name}
              </a>
              <p className="text-sm text-slate-600 dark:text-slate-300">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Technischer Status</h2>
        <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <Status ok={isConfigured.supabase} label="Supabase (Synchronisierung)" />
          <Status ok={isConfigured.ors} label="openrouteservice (Fahrzeiten)" />
        </ul>
      </section>
    </div>
  )
}
