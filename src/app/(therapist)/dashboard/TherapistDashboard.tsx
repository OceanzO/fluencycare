"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ClipboardList,
  FileAudio,
  Mic,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { useSession } from "@/lib/auth/AuthContext";
import { useRepository } from "@/lib/data/useRepository";
import { formatDate, formatDuration, formatPercent } from "@/lib/format";
import type { Assessment } from "@/lib/types";

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function SSTrend({ items }: { items: Assessment[] }) {
  const data = items.slice(0, 8).reverse();
  const max = Math.max(10, ...data.map((a) => a.ssPercentage));
  return (
    <div className="card flex flex-col p-6 animate-fade-up" style={{ animationDelay: "240ms" }}>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-bold text-navy">Tren %SS terbaru</h2>
        <Badge tone="muted">{data.length} asesmen</Badge>
      </div>
      <p className="mb-6 text-xs text-muted">Nilai %SS per asesmen (urut waktu). Interpretasi oleh terapis.</p>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Belum ada data.</p>
      ) : (
        <div className="flex h-44 items-end gap-2.5">
          {data.map((a) => (
            <div key={a.id} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-bold text-navy opacity-0 transition group-hover:opacity-100">
                {formatPercent(a.ssPercentage)}
              </span>
              <div
                className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-brand to-[#6f8fd0] transition-all duration-500 group-hover:from-navy group-hover:to-brand"
                style={{ height: `${Math.max(4, (a.ssPercentage / max) * 100)}%` }}
                title={`${a.clientCode} · ${formatPercent(a.ssPercentage)}`}
              />
              <span className="text-[10px] font-semibold text-muted">{a.clientCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TherapistDashboard() {
  const session = useSession();
  const repo = useRepository();
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    repo
      .listAssessments()
      .then((data) => !cancelled && setAssessments(data))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const stats = useMemo(() => {
    const list = assessments ?? [];
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      total: list.length,
      clients: new Set(list.map((a) => a.clientCode)).size,
      avgSS: list.length ? list.reduce((s, a) => s + a.ssPercentage, 0) / list.length : 0,
      thisMonth: list.filter((a) => a.assessmentDate.startsWith(monthKey)).length,
      withAudio: list.filter((a) => a.audio).length,
    };
  }, [assessments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = assessments ?? [];
    return (q ? list.filter((a) => a.clientCode.toLowerCase().includes(q)) : list).slice(0, 8);
  }, [assessments, query]);

  const firstName = session.user.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Dashboard"}
        title={now ? `${greeting(now)}, ${firstName}` : `Halo, ${firstName}`}
        description="Ringkasan dokumentasi asesmen kelancaran bicara Anda."
        actions={
          <Link id="cta-new-assessment" href="/assessments/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Mulai Asesmen Baru
          </Link>
        }
      />

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-light p-4 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {assessments === null && !error ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[138px] rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={ClipboardList} label="Total asesmen" value={stats.total} hint={`${stats.withAudio} dengan rekaman audio`} delay={0} />
            <StatCard icon={Users} label="Klien terdokumentasi" value={stats.clients} hint="Berdasarkan kode klien unik" tone="navy" delay={60} />
            <StatCard icon={Activity} label="Rata-rata %SS" value={formatPercent(stats.avgSS)} hint="Seluruh asesmen" tone="success" delay={120} />
            <StatCard icon={CalendarDays} label="Asesmen bulan ini" value={stats.thisMonth} hint={new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })} tone="warning" delay={180} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* Quick start */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-brand p-6 text-white shadow-lift animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div aria-hidden="true" className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <Sparkles className="relative h-6 w-6 text-brand-light" />
          <h2 className="relative mt-3 text-xl font-extrabold">Siap mendokumentasikan sesi berikutnya?</h2>
          <p className="relative mt-2 text-sm text-white/75">
            Isi identitas klien, pilih tugas bicara, rekam sampel, lalu hitung %SS secara otomatis — semuanya dalam satu formulir.
          </p>
          <ol className="relative mt-5 grid gap-2 text-sm">
            {["Identitas & riwayat", "Observasi ketidaklancaran", "Rekam sampel bicara", "Hitung %SS & simpan"].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-xs font-bold ring-1 ring-white/25">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link href="/assessments/new" className="btn relative mt-6 bg-white text-navy hover:bg-brand-light">
            <Mic className="h-4 w-4" /> Mulai sekarang
          </Link>
        </div>

        <SSTrend items={assessments ?? []} />
      </div>

      {/* Riwayat terbaru */}
      <section className="card mt-6 overflow-hidden animate-fade-up" style={{ animationDelay: "280ms" }}>
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy">Riwayat asesmen terbaru</h2>
            <p className="text-xs text-muted">Menampilkan maksimal 8 asesmen terakhir.</p>
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">Cari kode klien</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="search-client"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode klien..."
              className="input py-2 pl-9"
            />
          </label>
        </div>

        {assessments === null && !error ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={query ? "Tidak ada hasil" : "Belum ada asesmen"}
            description={query ? `Tidak ditemukan asesmen dengan kode klien "${query}".` : "Asesmen yang Anda simpan akan muncul di sini."}
            action={
              !query && (
                <Link href="/assessments/new" className="btn-primary">
                  <Plus className="h-4 w-4" /> Buat asesmen pertama
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-canvas/70 text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Kode klien</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Usia</th>
                  <th className="px-5 py-3">Suku kata</th>
                  <th className="px-5 py-3">%SS</th>
                  <th className="px-5 py-3">Audio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((a) => (
                  <tr key={a.id} className="transition hover:bg-brand-light/40">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-navy">{a.clientCode}</span>
                      <p className="max-w-[220px] truncate text-xs text-muted">{a.speechTasks.join(", ") || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-navy">{formatDate(a.assessmentDate)}</td>
                    <td className="px-5 py-3.5 text-navy">{a.clientAge} th</td>
                    <td className="px-5 py-3.5 text-muted">
                      <span className="font-semibold text-navy">{a.stutteredSyllables}</span> / {a.totalSyllables}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone="brand">{formatPercent(a.ssPercentage)}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.audio ? (
                        <Badge tone="success">
                          <FileAudio className="h-3 w-3" /> {formatDuration(a.audio.durationSeconds)}
                        </Badge>
                      ) : (
                        <Badge tone="muted">Tidak ada</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
