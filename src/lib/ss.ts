export const MAX_SYLLABLES = 100_000;
const INTEGER = /^\d+$/;

export interface SSResult {
  valid: boolean;
  total: number | null;
  stuttered: number | null;
  percentage: number | null;
  errors: { total?: string; stuttered?: string };
}

/** %SS = (suku kata gagap / total suku kata) × 100, dibulatkan 2 desimal. */
export function computeSS(stuttered: number, total: number): number {
  return Math.round((stuttered / total) * 10_000) / 100;
}

/**
 * Validasi ketat input %SS dari string mentah form.
 * - total: bilangan bulat > 0 (mencegah pembagian dengan nol)
 * - stuttered: bilangan bulat ≥ 0 dan ≤ total
 */
export function validateSS(totalRaw: string, stutteredRaw: string): SSResult {
  const errors: SSResult["errors"] = {};
  const t = totalRaw.trim();
  const s = stutteredRaw.trim();
  let total: number | null = null;
  let stuttered: number | null = null;

  if (t === "") {
    errors.total = "Jumlah seluruh suku kata wajib diisi.";
  } else if (!INTEGER.test(t)) {
    errors.total = "Gunakan bilangan bulat positif (tanpa koma, tanda minus, atau huruf).";
  } else {
    total = Number(t);
    if (total === 0) {
      errors.total = "Jumlah seluruh suku kata harus lebih dari 0 (tidak dapat membagi dengan nol).";
    } else if (total > MAX_SYLLABLES) {
      errors.total = `Maksimal ${MAX_SYLLABLES.toLocaleString("id-ID")} suku kata per sampel.`;
    }
  }

  if (s === "") {
    errors.stuttered = "Jumlah suku kata gagap wajib diisi (isi 0 bila tidak ada).";
  } else if (!INTEGER.test(s)) {
    errors.stuttered = "Gunakan bilangan bulat ≥ 0 (tanpa koma, tanda minus, atau huruf).";
  } else {
    stuttered = Number(s);
    if (!errors.total && total !== null && stuttered > total) {
      errors.stuttered = "Suku kata gagap tidak boleh melebihi jumlah seluruh suku kata.";
    }
  }

  const valid = !errors.total && !errors.stuttered && total !== null && stuttered !== null;
  return {
    valid,
    total,
    stuttered,
    errors,
    percentage: valid ? computeSS(stuttered as number, total as number) : null,
  };
}
