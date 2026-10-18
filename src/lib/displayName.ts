const KEY = 'reise-app:display-name'

export function loadDisplayName(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveDisplayName(name: string) {
  try {
    localStorage.setItem(KEY, name.trim())
  } catch {
    // ignorieren
  }
}
