export type View = 'liste' | 'karte'

export default function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const btn = (v: View, label: string) => (
    <button
      type="button"
      onClick={() => onChange(v)}
      aria-pressed={view === v}
      className={`min-h-11 flex-1 rounded-lg text-sm font-medium ${view === v ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500 dark:text-slate-400'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800">
      {btn('liste', '☰ Liste')}
      {btn('karte', '🗺️ Karte')}
    </div>
  )
}
