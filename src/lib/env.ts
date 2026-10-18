// Werte werden beim Build aus den GitHub Repository Secrets eingesetzt.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  orsKey: import.meta.env.VITE_ORS_API_KEY ?? '',
}

export const isConfigured = {
  supabase: Boolean(env.supabaseUrl && env.supabaseKey),
  ors: Boolean(env.orsKey),
}
