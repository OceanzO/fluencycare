export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** true jika kredensial Supabase tersedia di environment. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Mode Demo & fallback kredensial bawaan:
 * Aktif sebagai pengaman / fallback cadangan agar akun presentasi klinik selalu dapat login.
 */
export const isDemoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO !== "false";

export const AUDIO_BUCKET = "audio_samples";
