import type { User } from "@supabase/supabase-js";
import { DEMO_USERS } from "../constants";
import type { AppUser, AuthMode, Role } from "../types";

/** Logika sesi murni — aman dipakai di proxy, server component, maupun client. */

export function isRole(value: unknown): value is Role {
  return value === "therapist" || value === "admin";
}

export function demoUserFromCookie(value: string | undefined): AppUser | null {
  return isRole(value) ? DEMO_USERS[value] : null;
}

/**
 * Peran akun Supabase dibaca dari `app_metadata.role` (hanya bisa diubah oleh service role),
 * bukan `user_metadata` yang dapat diubah sendiri oleh pengguna.
 */
export function userFromSupabase(user: User): AppUser {
  const role: Role = user.app_metadata?.role === "admin" ? "admin" : "therapist";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";
  return {
    id: user.id,
    email,
    fullName: (typeof meta.full_name === "string" && meta.full_name) || email.split("@")[0] || "Pengguna",
    title:
      (typeof meta.title === "string" && meta.title) ||
      (role === "admin" ? "Administrator Klinik" : "Terapis Wicara"),
    role,
  };
}

/** Mode Demo bebas beralih peran; di Supabase hanya akun admin yang boleh masuk Mode Admin. */
export function canUseRole(user: AppUser, mode: AuthMode, role: Role): boolean {
  return mode === "demo" || role === "therapist" || user.role === "admin";
}

export function resolveActiveRole(user: AppUser, mode: AuthMode, cookieValue: string | undefined): Role {
  const wanted: Role = isRole(cookieValue) ? cookieValue : user.role;
  return canUseRole(user, mode, wanted) ? wanted : "therapist";
}

/** Hanya izinkan redirect internal (mencegah open redirect). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return null;
  return next;
}
