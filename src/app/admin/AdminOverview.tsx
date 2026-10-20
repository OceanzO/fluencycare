"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Database,
  HardDrive,
  ListChecks,
  Search,
  Stethoscope,
  Users,
  FileAudio,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRepository } from "@/lib/data/useRepository";
import { formatBytes, formatDate, formatDuration, formatPercent } from "@/lib/format";
import type { Assessment, ManagedUser, MasterData, StorageUsage } from "@/lib/types";

export function AdminOverview() {
  const { switchRole } = useAuth();
  const repo = useRepository();

  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [master, setMaster] = useState<MasterData | null>(null);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      repo.listUsers(),
      repo.listAssessments(),
      repo.getMasterData(),
      repo.getStorageUsage(),
    ])
      .then(([u, a, m, s]) => {
        if (!cancelled) {
          setUsers(u);
          setAssessments(a);
          setMaster(m);
          setStorage(s);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [repo]);

  const stats = useMemo(() => {
    const uList = users ?? [];
    const aList = assessments ?? [];
    const therapists = uList.filter((u) => u.accountType === "therapist").length;
    const students = uList.filter((u) => u.accountType === "student").length;
    const withAudio = aList.filter((a) => a.audio).length;

    return {
      totalUsers: uList.length,
      therapists,
      students,
      totalAssessments: aList.length,
      withAudio,
      storageBytes: storage?.bytes ?? 0,
      storageFiles: storage?.files ?? 0,
      speechTasksCount: master?.speechTasks.length ?? 0,
      disfluencyCount: master?.disfluencyTypes.length ?? 0,
    };
  }, [users, assessments, master, storage]);

  const filteredAssessments = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = assessments ?? [];
    if (!q) return list.slice(0, 8);
    return list
      .filter(
        (a) =>
          a.clientCode.toLowerCase().includes(q) ||
          a.therapistName.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [assessments, query]);

  const isLoading = users === null || assessments === null;

  return (
    <>
      <PageHeader
        eyebrow="Mode Administrator"
        title="Admin Overview"
        description="Ringkasan sistem, aktivitas asesmen klinis, manajemen pengguna, dan master data."
        actions={
          <button
            id="switch-to-therapist"
            type="button"
            onClick={() => switchRole("therapist")}
            className="btn-primary"
          >
            <Stethoscope className="h-4 w-4" /> Buka Mode Terapis
          </button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-light p-4 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Statistik Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading && !error ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[138px] rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Pengguna"
              value={stats.totalUsers}
              hint={`${stats.therapists} Terapis, ${stats.students} Mahasiswa`}
              delay={0}
            />
            <StatCard
              icon={ClipboardList}
              label="Total Asesmen"
              value={stats.totalAssessments}
              hint={`${stats.withAudio} asesmen dengan rekaman audio`}
              tone="navy"
              delay={60}
            />
            <StatCard
              icon={HardDrive}
              label="Penyimpanan Audio"
              value={formatBytes(stats.storageBytes)}
              hint={`${stats.storageFiles} file audio tersimpan`}
              tone="success"
              delay={120}
            />
            <StatCard
              icon={Database}
              label="Master Data"
              value={`${stats.speechTasksCount + stats.disfluencyCount} item`}
              hint={`${stats.speechTasksCount} tugas, ${stats.disfluencyCount} jenis ketidaklancaran`}
              tone="warning"
              delay={180}
            />
          </>
        )}
      </div>

      {/* Pintasan Modul Admin */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-6 transition-all hover:shadow-lift">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand">
              <Users className="h-6 w-6" />
            </span>
            <Badge tone="brand">Kelola Akun</Badge>
          </div>
          <h2 className="mt-4 text-lg font-bold text-navy">Manajemen Pengguna</h2>
          <p className="mt-1 text-sm text-muted">
            Kelola akun terapis dan mahasiswa, tinjau status aktif, serta pantau jumlah asesmen yang dikerjakan.
          </p>
          <Link
            href="/admin/users"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
          >
            Buka Manajemen Pengguna <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="card p-6 transition-all hover:shadow-lift">
          <div className="flex items-start justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-success-light text-success">
              <ListChecks className="h-6 w-6" />
            </span>
            <Badge tone="success">Checklist Klinis</Badge>
          </div>
          <h2 className="mt-4 text-lg font-bold text-navy">Master Data Klinis</h2>
          <p className="mt-1 text-sm text-muted">
            Atur opsi tugas bicara standar (bicara spontan, bercerita, dll.) dan klasifikasi jenis ketidaklancaran bicara.
          </p>
          <Link
            href="/admin/master-data"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
          >
            Konfigurasi Master Data <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Tabel Asesmen Terkini Seluruh Sistem */}
      <section className="card mt-6 overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-navy">Asesmen Klinis Terbaru</h2>
            <p className="text-xs text-muted">Seluruh asesmen yang tercatat dari semua terapis dan mahasiswa.</p>
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">Cari kode klien atau terapis</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="search-admin-assessments"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode klien / terapis..."
              className="input py-2 pl-9"
            />
          </label>
        </div>

        {isLoading && !error ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={query ? "Tidak ada hasil" : "Belum ada asesmen"}
            description={
              query
                ? `Tidak ditemukan asesmen yang cocok dengan pencarian "${query}".`
                : "Belum ada asesmen yang didokumentasikan di sistem."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-canvas/70 text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Kode Klien</th>
                  <th className="px-5 py-3">Terapis</th>
                  <th className="px-5 py-3">Tanggal</th>
                  <th className="px-5 py-3">Suku Kata</th>
                  <th className="px-5 py-3">%SS</th>
                  <th className="px-5 py-3">Audio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredAssessments.map((a) => (
                  <tr key={a.id} className="transition hover:bg-brand-light/40">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-navy">{a.clientCode}</span>
                      <p className="max-w-[220px] truncate text-xs text-muted">
                        {a.speechTasks.join(", ") || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-navy">{a.therapistName}</span>
                    </td>
                    <td className="px-5 py-3.5 text-navy">{formatDate(a.assessmentDate)}</td>
                    <td className="px-5 py-3.5 text-muted">
                      <span className="font-semibold text-navy">{a.stutteredSyllables}</span> /{" "}
                      {a.totalSyllables}
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
