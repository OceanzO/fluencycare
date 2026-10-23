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
  Mail,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { FieldError } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Role } from "@/lib/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  { icon: ClipboardCheck, title: "Observasi terstruktur", text: "Checklist tugas bicara & jenis ketidaklancaran." },
  { icon: AudioLines, title: "Rekam sampel bicara", text: "Langsung dari peramban, siap diputar ulang." },
  { icon: Calculator, title: "%SS otomatis", text: "Perhitungan real-time dengan validasi klinis." },
];

const ROLE_OPTIONS: { value: Role; label: string; icon: typeof Stethoscope }[] = [
  { value: "therapist", label: "Terapis", icon: Stethoscope },
  { value: "admin", label: "Admin", icon: UserCog },
];

export function LoginView({ next }: { next: string | null }) {
  const { signInWithPassword, signInDemo, isDemoEnabled, isSupabaseConfigured } = useAuth();
  const [role, setRole] = useState<Role>("therapist");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const emailError = !email.trim()
    ? "Email wajib diisi."
    : !EMAIL_PATTERN.test(email.trim())
      ? "Format email tidak valid."
      : undefined;
  const passwordError = !password ? "Kata sandi wajib diisi." : password.length < 6 ? "Kata sandi minimal 6 karakter." : undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (emailError || passwordError) return;
    setSubmitting(true);
    const { error } = await signInWithPassword(email.trim(), password, role, next);
    if (error) {
      setFormError(error);
      setSubmitting(false);
    }
  }

  function handleDemo(r: Role) {
    setDemoLoading(r);
    signInDemo(r);
  }

  function fillDemo() {
    setEmail(DEMO_USERS[role].email);
    setPassword(DEMO_PASSWORD);
    setFormError(null);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Panel branding ---------- */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-navy via-[#2c4a85] to-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-brand-light/20 blur-3xl" />
          <svg className="absolute right-0 bottom-28 left-0 h-40 w-full opacity-25" viewBox="0 0 600 120" preserveAspectRatio="none">
            <path
              d="M0 60 C 40 60, 50 20, 80 20 S 120 100, 150 100 S 190 10, 220 10 S 260 90, 290 90 S 330 40, 360 40 S 400 75, 430 75 S 470 30, 500 30 S 560 60, 600 60"
              fill="none"
              stroke="white"
              strokeWidth="3"
            />
          </svg>
        </div>

        <div className="relative">
          <Logo inverted />
        </div>

        <div className="relative max-w-md animate-fade-up">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Portal klinis untuk terapis wicara
          </p>
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
            Find your rhythm — dokumentasi asesmen kelancaran bicara.
          </h2>
          <p className="mt-4 text-white/75">
            Catat riwayat, observasi ketidaklancaran, rekam sampel bicara, dan hitung %SS secara konsisten — siap ditinjau
            dan dicetak.
          </p>
          <ul className="mt-8 space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${150 + i * 100}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Flunify adalah alat bantu dokumentasi — interpretasi & diagnosis tetap menjadi kewenangan terapis.
        </p>
      </section>

      {/* ---------- Form login ---------- */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-navy">Selamat datang kembali</h1>
              <p className="mt-1 text-sm text-muted">Masuk untuk melanjutkan dokumentasi asesmen.</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                isSupabaseConfigured ? "bg-success-light text-success" : "bg-warning-light text-warning",
              )}
            >
              {isSupabaseConfigured ? "Supabase" : "Mode Demo"}
            </span>
          </div>

          {/* Pilih peran */}
          <div role="radiogroup" aria-label="Masuk sebagai" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-card ring-1 ring-line">
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
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                    active ? "bg-brand text-white shadow-md" : "text-muted hover:bg-brand-light/60 hover:text-navy",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  Mode {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@klinik.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={touched && !!emailError}
                  aria-describedby="email-error"
                  className={cn("input pl-10", touched && emailError && "input-error")}
                />
              </div>
              <FieldError id="email-error" message={touched ? emailError : undefined} />
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
              <div role="alert" className="rounded-xl border border-danger/20 bg-danger-light px-3.5 py-3 text-sm font-medium text-danger">
                {formError}
              </div>
            )}

            <button id="login-submit" type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {submitting ? "Memproses..." : `Masuk sebagai ${role === "admin" ? "Admin" : "Terapis"}`}
            </button>

            {!isSupabaseConfigured && (
              <button id="fill-demo" type="button" onClick={fillDemo} className="w-full text-center text-xs font-semibold text-brand hover:underline">
                Isi otomatis kredensial demo {role === "admin" ? "admin" : "terapis"}
              </button>
            )}
          </form>

          {isDemoEnabled && (
            <div className="mt-6">
              <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-muted">
                <span className="h-px flex-1 bg-line" /> atau akses cepat <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    id={`demo-login-${value}`}
                    type="button"
                    disabled={demoLoading !== null}
                    onClick={() => handleDemo(value)}
                    className="group card flex items-center gap-3 p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift disabled:opacity-60"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-light text-brand transition group-hover:bg-brand group-hover:text-white">
                      {demoLoading === value ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                    </span>
                    <span>
                      <span className="flex items-center gap-1 text-sm font-bold text-navy">
                        <Zap className="h-3.5 w-3.5 text-warning" /> Demo {label}
                      </span>
                      <span className="block text-xs text-muted">{DEMO_USERS[value].fullName}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Data klien disimpan menggunakan kode anonim (mis. C001) tanpa nama asli. Rekaman audio disimpan di penyimpanan
            privat dan hanya dapat diakses oleh terapis terkait & admin.
          </p>
        </div>
      </section>
    </main>
  );
}
