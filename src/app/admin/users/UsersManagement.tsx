"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Loader2,
  Plus,
  Search,
  Shield,
  Stethoscope,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from "lucide-react";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { useRepository } from "@/lib/data/useRepository";
import { formatDate } from "@/lib/format";
import type { AccountStatus, AccountType, ManagedUser } from "@/lib/types";

const ROLE_LABELS: Record<AccountType, { label: string; tone: "brand" | "navy" | "warning" }> = {
  therapist: { label: "Terapis Wicara", tone: "brand" },
  student: { label: "Mahasiswa", tone: "navy" },
  admin: { label: "Administrator", tone: "warning" },
};

export function UsersManagement() {
  const repo = useRepository();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("therapist");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = () => {
    repo
      .listUsers()
      .then((data) => setUsers(data))
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  const filtered = useMemo(() => {
    const list = users ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((u) => {
      const matchQuery =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.accountType === roleFilter;
      return matchQuery && matchRole;
    });
  }, [users, query, roleFilter]);

  async function handleAddUser(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setFormError("Nama lengkap dan email wajib diisi.");
      return;
    }
    if (!repo.addUser) {
      setFormError("Penambahan akun memerlukan integrasi otorisasi admin via Supabase.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await repo.addUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        accountType,
      });
      setShowAddModal(false);
      setFullName("");
      setEmail("");
      setAccountType("therapist");
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Gagal menambahkan pengguna.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(user: ManagedUser) {
    const nextStatus: AccountStatus = user.status === "active" ? "inactive" : "active";
    setActionLoadingId(user.id);
    try {
      await repo.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)) : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const isLoading = users === null;

  return (
    <>
      <PageHeader
        eyebrow="Administrasi"
        title="Manajemen Pengguna"
        description="Daftar akun terapis, mahasiswa, dan administrator sistem Flunify."
        actions={
          repo.addUser && (
            <button
              id="btn-add-user"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Tambah Pengguna
            </button>
          )
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

      {/* Filter & Pencarian */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative block w-full sm:w-64">
              <span className="sr-only">Cari pengguna</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="search-users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="input py-2 pl-9"
              />
            </label>

            <select
              id="filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input w-auto py-2 pr-8"
              aria-label="Filter peran pengguna"
            >
              <option value="all">Semua Peran</option>
              <option value="therapist">Terapis Wicara</option>
              <option value="student">Mahasiswa</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <p className="text-xs font-semibold text-muted">
            Menampilkan {filtered.length} dari {users?.length ?? 0} akun
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query || roleFilter !== "all" ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}
            description={
              query || roleFilter !== "all"
                ? "Cobalah kata kunci lain atau ubah filter peran."
                : "Pengguna yang ditambahkan akan muncul di sini."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-canvas/70 text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Nama Lengkap & Email</th>
                  <th className="px-5 py-3">Peran Akun</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Asesmen Dibuat</th>
                  <th className="px-5 py-3">Tanggal Dibuat</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((u) => {
                  const roleConfig = ROLE_LABELS[u.accountType];
                  const isActionLoading = actionLoadingId === u.id;
                  return (
                    <tr key={u.id} className="transition hover:bg-brand-light/30">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-navy">{u.fullName}</span>
                        <p className="text-xs text-muted">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={roleConfig.tone}>{roleConfig.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.status === "active" ? (
                          <Badge tone="success">
                            <UserCheck className="h-3 w-3" /> Aktif
                          </Badge>
                        ) : (
                          <Badge tone="danger">
                            <UserX className="h-3 w-3" /> Nonaktif
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-navy">
                        {u.assessmentCount} asesmen
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          id={`toggle-status-${u.id}`}
                          type="button"
                          disabled={isActionLoading}
                          onClick={() => toggleStatus(u)}
                          className="btn text-xs py-1.5 px-3 border border-line hover:border-brand/40"
                        >
                          {isActionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : u.status === "active" ? (
                            "Nonaktifkan"
                          ) : (
                            "Aktifkan"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Tambah Pengguna */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 shadow-lift animate-scale-up">
            <h2 className="text-xl font-bold text-navy">Tambah Pengguna Baru</h2>
            <p className="mt-1 text-xs text-muted">
              Masukkan data akun pengguna baru untuk terapis atau mahasiswa.
            </p>

            <form onSubmit={handleAddUser} className="mt-4 space-y-4">
              <div>
                <label htmlFor="user-fullname" className="label">
                  Nama Lengkap
                </label>
                <input
                  id="user-fullname"
                  type="text"
                  required
                  placeholder="Contoh: dr. Anita Rahayu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="user-email" className="label">
                  Alamat Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  placeholder="nama@klinik.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="user-role" className="label">
                  Peran Akun
                </label>
                <select
                  id="user-role"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="input"
                >
                  <option value="therapist">Terapis Wicara</option>
                  <option value="student">Mahasiswa Terapi Wicara</option>
                  <option value="admin">Administrator Klinik</option>
                </select>
              </div>

              {formError && (
                <div className="rounded-xl border border-danger/20 bg-danger-light p-3 text-xs text-danger">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="btn border border-line hover:bg-canvas"
                >
                  Batal
                </button>
                <button
                  id="submit-add-user"
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {submitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
