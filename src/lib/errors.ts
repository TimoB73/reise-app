/** Fehler mit einer für Nutzer verständlichen Meldung. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function userMessage(err: unknown): string {
  if (err instanceof AppError) return err.message
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'Keine Internetverbindung.'
  return 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
}
