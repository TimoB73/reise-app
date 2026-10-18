import type { ReactNode } from 'react'

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ message, onRetry, children }: { message: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-100" role="alert">
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-rose-600 px-4 font-medium text-white active:bg-rose-700">
            Erneut versuchen
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export function EmptyBox({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">{children}</div>
}
