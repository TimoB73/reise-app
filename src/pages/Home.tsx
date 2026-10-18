const categories = [
  { icon: '🚶', title: 'Highlights zu Fuß', subtitle: 'Sehenswertes im Umkreis von 2 km', phase: 2 },
  { icon: '🚗', title: 'Highlights mit dem Auto', subtitle: 'Bedeutende Ziele in unter 1 Stunde', phase: 4 },
  { icon: '✨', title: 'Spektakuläre Highlights', subtitle: 'Die Top 15 in unter 2 Stunden', phase: 4 },
  { icon: '📜', title: 'Geschichte der Region', subtitle: 'Was diesen Ort geprägt hat', phase: 5 },
  { icon: '🍽️', title: 'Restaurants & Bars', subtitle: 'Essen und Trinken zu Fuß erreichbar', phase: 2 },
]

export default function Home() {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Willkommen!</p>
        <p className="mt-1 text-base">
          Entdeckt gemeinsam, was es rund um euren Standort zu sehen gibt. Die Funktionen werden Schritt für Schritt freigeschaltet.
        </p>
      </section>

      <ul className="space-y-3">
        {categories.map((c) => (
          <li key={c.title}>
            <button
              type="button"
              disabled
              className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm disabled:opacity-60 dark:bg-slate-900"
            >
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{c.title}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">{c.subtitle}</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                bald
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
