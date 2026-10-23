"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_COOKIE, DEMO_PASSWORD, DEMO_USERS, homeFor, ROLE_COOKIE } from "@/lib/constants";
import { isDemoEnabled, isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { canUseRole, safeNextPath, userFromSupabase } from "./session";
import type { Role, Session } from "@/lib/types";

interface SignInResult {
  error?: string;
}

interface AuthContextValue {
  session: Session | null;
  isDemoEnabled: boolean;
  isSupabaseConfigured: boolean;
  canSwitchRole: boolean;
  signInWithPassword: (usernameOrEmail: string, password: string, role: Role, next?: string | null) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const WEEK_SECONDS = 60 * 60 * 24 * 7;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${WEEK_SECONDS}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Navigasi penuh setelah perubahan sesi agar proxy & server layout
 * selalu membaca cookie terbaru.
 */
function hardNavigate(path: string) {
  window.location.assign(path);
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Username atau kata sandi tidak valid.";
  if (m.includes("email not confirmed")) return "Akun belum dikonfirmasi. Periksa kotak masuk email Anda.";
  if (m.includes("rate limit") || m.includes("too many")) return "Terlalu banyak percobaan login. Coba lagi dalam beberapa saat.";
  if (m.includes("fetch")) return "Tidak dapat terhubung ke server database. Periksa koneksi internet.";
  return message;
}

export function AuthProvider({ initialSession, children }: { initialSession: Session | null; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => setSession(initialSession), [initialSession]);

  // Sinkronkan logout dari tab lain / token kedaluwarsa (khusus Supabase).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || session?.mode !== "supabase") return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") hardNavigate("/login");
    });
    return () => data.subscription.unsubscribe();
  }, [session?.mode]);

  const signInWithPassword = useCallback<AuthContextValue["signInWithPassword"]>(
    async (usernameOrEmail, password, role, next) => {
      const destination = safeNextPath(next) ?? homeFor(role);
      const supabase = getSupabaseBrowserClient();
      const trimmed = usernameOrEmail.trim().toLowerCase();
      const normalizedEmail = trimmed.includes("@") ? trimmed : `${trimmed}@flunify.id`;

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error || !data.user) return { error: translateAuthError(error?.message ?? "Gagal login.") };
        const user = userFromSupabase(data.user);
        if (!canUseRole(user, "supabase", role)) {
          await supabase.auth.signOut();
          return {
            error:
              role === "admin"
                ? "Akun ini tidak memiliki hak akses Administrator."
                : "Akun ini tidak memiliki hak akses Terapis.",
          };
        }
        setCookie(ROLE_COOKIE, role);
        hardNavigate(role === "admin" ? homeFor(role) : destination);
        return {};
      }

      // Fallback lokal terautentikasi (mencocokkan username/role/email)
      const matchedUser = Object.values(DEMO_USERS).find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail ||
          u.email.toLowerCase().startsWith(trimmed + "@") ||
          u.role === trimmed ||
          u.fullName.toLowerCase().includes(trimmed)
      );

      if (!matchedUser || password !== DEMO_PASSWORD) {
        return { error: "Username atau kata sandi tidak valid. Silakan periksa kembali." };
      }

      if (role === "admin" && matchedUser.role !== "admin") {
        return { error: "Akun ini tidak memiliki hak akses Administrator." };
      }

      setCookie(DEMO_COOKIE, matchedUser.role);
      setCookie(ROLE_COOKIE, role);
      hardNavigate(role === "admin" ? homeFor(role) : destination);
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase && session?.mode === "supabase") await supabase.auth.signOut();
    clearCookie(DEMO_COOKIE);
    clearCookie(ROLE_COOKIE);
    hardNavigate("/login");
  }, [session?.mode]);

  const switchRole = useCallback((role: Role) => {
    // Role switcher dinonaktifkan di tampilan utama sesuai kebijakan hak akses terpisah.
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isDemoEnabled,
      isSupabaseConfigured,
      canSwitchRole: false, // Tidak dapat di-switch di dashboard utama
      signInWithPassword,
      signOut,
      switchRole,
    }),
    [session, signInWithPassword, signOut, switchRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>.");
  return ctx;
}

/** Untuk halaman terproteksi — sesi dijamin ada oleh proxy & layout server. */
export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error("Sesi tidak ditemukan.");
  return session;
}
