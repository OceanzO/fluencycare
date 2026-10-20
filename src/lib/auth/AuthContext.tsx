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
  signInWithPassword: (email: string, password: string, role: Role, next?: string | null) => Promise<SignInResult>;
  signInDemo: (role: Role) => void;
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
 * Navigasi penuh (bukan client-side) setelah perubahan sesi agar proxy & server
 * layout membaca cookie terbaru — menghindari state sesi yang basi.
 */
function hardNavigate(path: string) {
  window.location.assign(path);
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Periksa kotak masuk Anda.";
  if (m.includes("rate limit") || m.includes("too many")) return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (m.includes("fetch")) return "Tidak dapat terhubung ke server. Periksa koneksi internet.";
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
    async (email, password, role, next) => {
      const destination = safeNextPath(next) ?? homeFor(role);
      const supabase = getSupabaseBrowserClient();

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return { error: translateAuthError(error?.message ?? "Gagal masuk.") };
        const user = userFromSupabase(data.user);
        if (!canUseRole(user, "supabase", role)) {
          await supabase.auth.signOut();
          return { error: "Akun ini tidak memiliki akses Mode Admin. Pilih Mode Terapis." };
        }
        setCookie(ROLE_COOKIE, role);
        hardNavigate(role === "admin" ? homeFor(role) : destination);
        return {};
      }

      // Mode Demo: hanya menerima kredensial akun demo.
      const demoUser = Object.values(DEMO_USERS).find((u) => u.email === email.trim().toLowerCase());
      if (!demoUser || password !== DEMO_PASSWORD) {
        return { error: `Supabase belum dikonfigurasi. Gunakan akun demo (kata sandi: ${DEMO_PASSWORD}) atau tombol Akses Demo.` };
      }
      setCookie(DEMO_COOKIE, demoUser.role);
      setCookie(ROLE_COOKIE, role);
      hardNavigate(role === "admin" ? homeFor(role) : destination);
      return {};
    },
    [],
  );

  const signInDemo = useCallback((role: Role) => {
    setCookie(DEMO_COOKIE, role);
    setCookie(ROLE_COOKIE, role);
    hardNavigate(homeFor(role));
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase && session?.mode === "supabase") await supabase.auth.signOut();
    clearCookie(DEMO_COOKIE);
    clearCookie(ROLE_COOKIE);
    hardNavigate("/login");
  }, [session?.mode]);

  const switchRole = useCallback(
    (role: Role) => {
      if (!session || !canUseRole(session.user, session.mode, role)) return;
      setCookie(ROLE_COOKIE, role);
      hardNavigate(homeFor(role));
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isDemoEnabled,
      isSupabaseConfigured,
      canSwitchRole: !!session && canUseRole(session.user, session.mode, "admin"),
      signInWithPassword,
      signInDemo,
      signOut,
      switchRole,
    }),
    [session, signInWithPassword, signInDemo, signOut, switchRole],
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
