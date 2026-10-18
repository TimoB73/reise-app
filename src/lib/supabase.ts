import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, isConfigured } from './env'
import { AppError } from './errors'

export const supabase: SupabaseClient | null = isConfigured.supabase
  ? createClient(env.supabaseUrl, env.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'reise-app-auth' },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new AppError('Die Synchronisierung ist nicht eingerichtet (Supabase-Zugangsdaten fehlen).', false)
  return supabase
}

/** Liefert die Nutzer-ID; meldet das Gerät bei Bedarf anonym an. */
export async function ensureUserId(): Promise<string> {
  const sb = requireSupabase()
  const { data } = await sb.auth.getSession()
  if (data.session?.user) return data.session.user.id
  const { data: signIn, error } = await sb.auth.signInAnonymously()
  if (error || !signIn.user) throw toAppError(error)
  return signIn.user.id
}

const SERVER_ERRORS: Record<string, string> = {
  trip_not_found: 'Keine Reise mit diesem Code gefunden. Bitte den Code prüfen.',
  trip_full: 'Diese Reise hat schon zwei Teilnehmer. Wer die Reise angelegt hat, kann den Partner-Platz unter „Reise“ freigeben.',
  trip_archived: 'Diese Reise ist bereits beendet.',
  invalid_name: 'Bitte einen Namen eingeben.',
  invalid_dates: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
  not_allowed: 'Das darf nur die Person, die die Reise angelegt hat.',
  not_authenticated: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
}

/** Übersetzt Fehler von Supabase in verständliche Meldungen. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err
  const e = (err ?? {}) as { message?: string; code?: string }
  const msg = e.message ?? ''
  for (const [key, text] of Object.entries(SERVER_ERRORS)) {
    if (msg.includes(key)) return new AppError(text, false)
  }
  if (/anonymous sign-ins are disabled/i.test(msg)) {
    return new AppError('Die anonyme Anmeldung ist in Supabase nicht aktiviert.', false)
  }
  if (e.code === '42P01' || e.code === 'PGRST202' || e.code === 'PGRST205' || /does not exist|could not find the function/i.test(msg)) {
    return new AppError('Die Datenbank ist noch nicht eingerichtet. Bitte die SQL-Datei im Supabase SQL Editor ausführen.', false)
  }
  if (/row-level security/i.test(msg)) return new AppError('Keine Berechtigung – ist die Reise schon beendet?', false)
  if (/fetch|network|load failed/i.test(msg) || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return new AppError('Keine Verbindung zum Server. Bitte Internetverbindung prüfen.')
  }
  return new AppError(msg ? `Fehler bei der Synchronisierung: ${msg}` : 'Fehler bei der Synchronisierung.')
}
