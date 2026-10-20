export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true jika kredensial Supabase tersedia di environment. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Mode Demo otomatis aktif bila Supabase belum dikonfigurasi.
 * Bisa dipaksa aktif di produksi dengan NEXT_PUBLIC_ENABLE_DEMO=true (tidak disarankan).
 */
export const isDemoEnabled =
  !isSupabaseConfigured || process.env.NEXT_PUBLIC_ENABLE_DEMO === "true";

export const AUDIO_BUCKET = "audio_samples";
