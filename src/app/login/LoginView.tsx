"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  AudioLines,
  Calculator,
  ClipboardCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  Stethoscope,
  User,
  UserCog,
} from "lucide-react";
import { Logo, LogoStacked } from "@/components/Logo";
import { FieldError } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/format";
import type { Role } from "@/lib/types";

const FEATURES = [
  { icon: ClipboardCheck, title: "Observasi terstruktur", text: "Checklist tugas bicara & jenis ketidaklancaran." },
  { icon: AudioLines, title: "Rekam sampel bicara", text: "Langsung dari peramban dengan kualitas audio jernih." },
  { icon: Calculator, title: "%SS otomatis", text: "Perhitungan real-time sesuai kaidah persentase suku kata gagap." },
];

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof Stethoscope }[] = [
  { value: "therapist", label: "Terapis", icon: Stethoscope },
  { value: "admin", label: "Admin", icon: UserCog },
];

export function LoginView({ next }: { next: string | null }) {
  const { signInWithPassword } = useAuth();
  const [role, setRole] = useState<Role>("therapist");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const usernameError = !username.trim()
    ? "Username wajib diisi."
    : username.trim().length < 3
      ? "Username minimal 3 karakter."
      : undefined;
  const passwordError = !password
    ? "Kata sandi wajib diisi."
    : password.length < 6
      ? "Kata sandi minimal 6 karakter."
      : undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (usernameError || passwordError) return;
    setSubmitting(true);
    const { error } = await signInWithPassword(username.trim(), password, role, next);
    if (error) {
      setFormError(error);
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ---------- Panel branding (Kiri) ---------- */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-navy via-[#274070] to-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-brand-light/20 blur-3xl" />
          <svg className="absolute right-0 bottom-24 left-0 h-44 w-full opacity-20" viewBox="0 0 600 120" preserveAspectRatio="none">
            <path
              d="M0 60 C 40 60, 50 20, 80 20 S 120 100, 150 100 S 190 10, 220 10 S 260 90, 290 90 S 330 40, 360 40 S 400 75, 430 75 S 470 30, 500 30 S 560 60, 600 60"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Brand header */}
        <div className="relative">
          <Logo inverted />
        </div>

        {/* Hero content */}
        <div className="relative max-w-lg animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/20">
            <ShieldCheck className="h-4 w-4 text-brand-light" /> Portal Asesmen Kelancaran Bicara
          </p>
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
            Find your rhythm — dokumentasi asesmen yang presisi dan terstruktur.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Catat riwayat keluhan, observasi ketidaklancaran (*disfluency*), rekam sampel bicara, dan hitung formula %SS
            secara akurat dalam satu sistem terintegrasi.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="flex items-start gap-3.5 animate-fade-up"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="relative text-[11px] leading-relaxed text-white/60">
          Flunify dirancang sebagai alat bantu dokumentasi klinis — interpretasi klinis dan diagnosis tetap menjadi
          kewenangan terapis wicara.
        </p>
      </section>

      {/* ---------- Form Login (Kanan) ---------- */}
      <section className="flex flex-col justify-between px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md my-auto animate-fade-up">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <LogoStacked />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-navy sm:text-3xl">Login Portal</h1>
            <p className="mt-1.5 text-sm text-muted">
              Silakan masukkan username dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {/* Pemilihan Role Akun */}
          <div
            role="radiogroup"
            aria-label="Pilih hak akses login"
            className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-line"
          >
            {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  id={`role-${value}`}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRole(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all duration-200",
                    active ? "bg-brand text-white shadow-md shadow-brand/20" : "text-muted hover:bg-brand-light/60 hover:text-navy"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6 sm:p-7">
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder={role === "admin" ? "Masukkan username admin" : "Masukkan username terapis"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={touched && !!usernameError}
                  aria-describedby="username-error"
                  className={cn("input pl-10", touched && usernameError && "input-error")}
                />
              </div>
              <FieldError id="username-error" message={touched ? usernameError : undefined} />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Kata sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={touched && !!passwordError}
                  aria-describedby="password-error"
                  className={cn("input pr-11 pl-10", touched && passwordError && "input-error")}
                />
                <button
                  id="toggle-password"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-brand-light hover:text-navy"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError id="password-error" message={touched ? passwordError : undefined} />
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-danger/20 bg-danger-light px-3.5 py-3 text-sm font-medium text-danger"
              >
                {formError}
              </div>
            )}

            <button id="login-submit" type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {submitting ? "Memproses Login..." : role === "admin" ? "Login sebagai Admin" : "Login sebagai Terapis"}
            </button>
          </form>

          {/* Security note */}
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Akses terenkripsi dan terlindungi. Data asesmen pasien disimpan dengan kode anonim untuk menjaga kerahasiaan
            data medis.
          </p>

          {/* Academic & Institution Footer Credit */}
          <div className="mt-8 border-t border-line/60 pt-6 text-center">
            <p className="text-[11px] font-medium tracking-wide text-muted/65 leading-relaxed">
              Developed by the Speech Therapy Scholars of Health Polytechnic of the Ministry of Health Surakarta
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.16em] uppercase text-muted/50">
              Poltekkes Kemenkes Surakarta
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
