"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Badge, EmptyState, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { useAuth, useSession } from "@/lib/auth/AuthContext";
import { useRepository } from "@/lib/data/useRepository";
import { cn, formatDate, initials } from "@/lib/format";
import type { AccountStatus, AccountType, LoginLog, ManagedUser } from "@/lib/types";

const ROLE_LABELS: Record<AccountType, { label: string; tone: "brand" | "navy" | "warning"; icon: typeof Stethoscope }> = {
  therapist: { label: "Terapis Wicara", tone: "brand", icon: Stethoscope },
  student: { label: "Mahasiswa", tone: "navy", icon: User },
  admin: { label: "Administrator", tone: "warning", icon: Shield },
};

export function UsersManagement() {
  const repo = useRepository();
  const session = useSession();
  const activeAdminEmail = session?.user.email?.toLowerCase();

  const [activeTab, setActiveTab] = useState<"users" | "logs">("users");
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [logs, setLogs] = useState<LoginLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter Pengguna
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filter Log
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");

  // Modal Tambah Pengguna
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFullName, setAddFullName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addAccountType, setAddAccountType] = useState<AccountType>("therapist");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal Edit / Reset Password Pengguna
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAccountType, setEditAccountType] = useState<AccountType>("therapist");
  const [editStatus, setEditStatus] = useState<AccountStatus>("active");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal Konfirmasi Hapus
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // UI helpers
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    repo
      .listUsers()
      .then((data) => setUsers(data))
      .catch((e: Error) => setError(e.message));

    if (repo.listLoginLogs) {
      repo
        .listLoginLogs()
        .then((l) => setLogs(l))
        .catch(() => setLogs([]));
    }
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  // Tampilkan notifikasi sesaat
  const notifySuccess = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Filter pengguna
  const filteredUsers = useMemo(() => {
    const list = users ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((u) => {
      const matchQuery =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.accountType === roleFilter;
      return matchQuery && matchRole;
    });
  }, [users, query, roleFilter]);

  // Filter login logs
  const filteredLogs = useMemo(() => {
    const list = logs ?? [];
    const q = logSearch.trim().toLowerCase();
    return list.filter((l) => {
      const matchStatus = logStatusFilter === "all" || l.status === logStatusFilter;
      const matchQuery =
        !q ||
        l.username.toLowerCase().includes(q) ||
        (l.fullName && l.fullName.toLowerCase().includes(q)) ||
        l.ipAddress.toLowerCase().includes(q) ||
        (l.message && l.message.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [logs, logStatusFilter, logSearch]);

  // Statistik Pengguna
  const userStats = useMemo(() => {
    const list = users ?? [];
    return {
      total: list.length,
      therapists: list.filter((u) => u.accountType === "therapist").length,
      students: list.filter((u) => u.accountType === "student").length,
      admins: list.filter((u) => u.accountType === "admin").length,
    };
  }, [users]);

  // Statistik Log
  const logStats = useMemo(() => {
    const list = logs ?? [];
    return {
      total: list.length,
      success: list.filter((l) => l.status === "success").length,
      failed: list.filter((l) => l.status === "failed").length,
    };
  }, [logs]);

  // Buka Modal Edit Pengguna
  function openEditModal(user: ManagedUser) {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username || user.email.split("@")[0]);
    setEditEmail(user.email);
    setEditPassword(user.password || "");
    setEditAccountType(user.accountType);
    setEditStatus(user.status);
    setEditError(null);
  }

  // Tambah Pengguna Baru
  async function handleAddUser(e: FormEvent) {
    e.preventDefault();
    if (!addFullName.trim() || !addUsername.trim()) {
      setAddError("Nama lengkap dan username wajib diisi.");
      return;
    }
    if (!repo.addUser) {
      setAddError("Fitur penambahan akun tidak didukung di mode ini.");
      return;
    }

    setSubmittingAdd(true);
    setAddError(null);
    try {
      await repo.addUser({
        fullName: addFullName.trim(),
        username: addUsername.trim().toLowerCase(),
        password: addPassword.trim() || "Terapis@Flunify2026",
        email: addEmail.trim() || undefined,
        accountType: addAccountType,
      });
      setShowAddModal(false);
      setAddFullName("");
      setAddUsername("");
      setAddPassword("");
      setAddEmail("");
      setAddAccountType("therapist");
      notifySuccess(`Akun @${addUsername.trim().toLowerCase()} berhasil ditambahkan.`);
      loadData();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Gagal menambahkan akun.");
    } finally {
      setSubmittingAdd(false);
    }
  }

  // Simpan Perubahan Pengguna
  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFullName.trim() || !editUsername.trim()) {
      setEditError("Nama lengkap dan username tidak boleh kosong.");
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);
    try {
      if (repo.updateUser) {
        await repo.updateUser(editingUser.id, {
          fullName: editFullName.trim(),
          username: editUsername.trim().toLowerCase(),
          email: editEmail.trim().toLowerCase(),
          password: editPassword ? editPassword.trim() : editingUser.password,
          accountType: editAccountType,
          status: editStatus,
        });
      } else {
        await repo.updateUserStatus(editingUser.id, editStatus);
      }
      setEditingUser(null);
      notifySuccess(`Data akun @${editUsername.trim()} berhasil diperbarui.`);
      loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Gagal memperbarui data pengguna.");
    } finally {
      setSubmittingEdit(false);
    }
  }

  // Hapus Pengguna
  async function handleDeleteUser() {
    if (!deletingUser) return;
    setSubmittingDelete(true);
    try {
      if (repo.deleteUser) {
        await repo.deleteUser(deletingUser.id);
        notifySuccess(`Akun @${deletingUser.username || deletingUser.email} telah dihapus.`);
        setDeletingUser(null);
        loadData();
      } else {
        throw new Error("Penghapusan akun tidak didukung pada mode repositori ini.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus pengguna.");
      setDeletingUser(null);
    } finally {
      setSubmittingDelete(false);
    }
  }

  // Toggle Status Aktif / Nonaktif
  async function toggleStatus(user: ManagedUser) {
    const nextStatus: AccountStatus = user.status === "active" ? "inactive" : "active";
    setActionLoadingId(user.id);
    try {
      await repo.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev ? prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)) : null,
      );
      notifySuccess(`Status @${user.username || user.email} diubah menjadi ${nextStatus === "active" ? "Aktif" : "Nonaktif"}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleCopyPassword = (userId: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLoading = users === null;

  return (
    <>
      <PageHeader
        eyebrow="Panel Administrator"
        title="Manajemen Pengguna & Riwayat"
        description="Kelola akun terapis wicara, ubah kata sandi, hapus akun, dan monitor riwayat login secara menyeluruh."
        actions={
          <div className="flex items-center gap-2">
            <button
              id="refresh-data"
              type="button"
              onClick={loadData}
              className="btn border border-line bg-white hover:bg-canvas text-navy text-xs py-2 px-3.5"
              title="Segarkan data"
            >
              <RefreshCw className="h-4 w-4" /> Segarkan
            </button>
            {repo.addUser && (
              <button
                id="btn-add-user"
                type="button"
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs py-2 px-3.5"
              >
                <UserPlus className="h-4 w-4" /> Tambah Pengguna
              </button>
            )}
          </div>
        }
      />

      {/* Tab Navigasi Admin */}
      <div className="mb-6 flex items-center gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all",
            activeTab === "users"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:border-line hover:text-navy"
          )}
        >
          <Users className="h-4 w-4" />
          Manajemen Akun Terapis ({users?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all",
            activeTab === "logs"
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:border-line hover:text-navy"
          )}
        >
          <History className="h-4 w-4" />
          Riwayat Login & Audit ({logs?.length ?? 0})
        </button>
      </div>

      {/* Banner Pesan Sukses / Error */}
      {successNotice && (
        <div
          role="status"
          className="mb-6 flex items-center justify-between rounded-xl border border-success/20 bg-success-light px-4 py-3 text-sm font-semibold text-success animate-fade-up"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button type="button" onClick={() => setSuccessNotice(null)} className="text-success/70 hover:text-success">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-light p-4 text-sm text-danger animate-fade-up"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: MANAJEMEN AKUN TERAPIS & ADMIN                          */}
      {/* ============================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Metrik Akun */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon={Users} label="Total Akun" value={userStats.total} tone="navy" delay={0} />
            <StatCard icon={Stethoscope} label="Terapis Wicara" value={userStats.therapists} tone="brand" delay={50} />
            <StatCard icon={User} label="Mahasiswa" value={userStats.students} tone="brand" delay={100} />
            <StatCard icon={Shield} label="Administrator" value={userStats.admins} tone="warning" delay={150} />
          </div>

          {/* Filter & Tabel Akun */}
          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">Cari pengguna</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="search-users"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari nama, username, email..."
                    className="input py-2 pl-9"
                  />
                </label>

                <select
                  id="filter-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input w-auto py-2 pr-8 text-xs font-semibold"
                  aria-label="Filter peran pengguna"
                >
                  <option value="all">Semua Peran</option>
                  <option value="therapist">Terapis Wicara</option>
                  <option value="student">Mahasiswa</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <p className="text-xs font-semibold text-muted">
                Menampilkan {filteredUsers.length} dari {users?.length ?? 0} akun
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={query || roleFilter !== "all" ? "Pengguna tidak ditemukan" : "Belum ada akun"}
                description={
                  query || roleFilter !== "all"
                    ? "Cobalah kata kunci lain atau ubah filter peran."
                    : "Tambahkan akun terapis baru menggunakan tombol di atas."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-canvas/70 text-xs font-bold tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-5 py-3">Nama Lengkap & Username</th>
                      <th className="px-5 py-3">Peran Akun</th>
                      <th className="px-5 py-3">Kredensial Password</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Asesmen</th>
                      <th className="px-5 py-3 text-right">Aksi Administrator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredUsers.map((u) => {
                      const roleConfig = ROLE_LABELS[u.accountType];
                      const isActionLoading = actionLoadingId === u.id;
                      const isCurrentUser = u.email.toLowerCase() === activeAdminEmail;
                      const passVisible = showPasswords[u.id] ?? false;
                      const displayPass = u.password || (u.accountType === "admin" ? "Poltekkes@Admin2026" : "Terapis@Flunify2026");

                      return (
                        <tr key={u.id} className="transition hover:bg-brand-light/30">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-light text-xs font-bold text-brand">
                                {initials(u.fullName)}
                              </span>
                              <div>
                                <p className="font-bold text-navy flex items-center gap-1.5">
                                  {u.fullName}
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-brand/10 text-brand font-bold px-1.5 py-0.5 rounded">
                                      Anda
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-xs font-semibold text-brand">
                                    @{u.username || u.email.split("@")[0]}
                                  </span>
                                  <span className="text-line text-xs">•</span>
                                  <span className="text-xs text-muted">{u.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <Badge tone={roleConfig.tone}>{roleConfig.label}</Badge>
                          </td>

                          <td className="px-5 py-3.5">
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas/60 px-2 py-1">
                              <Lock className="h-3.5 w-3.5 text-muted" />
                              <span className="font-mono text-xs text-navy font-medium">
                                {passVisible ? displayPass : "••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPasswords((prev) => ({ ...prev, [u.id]: !passVisible }))}
                                className="ml-1 text-muted hover:text-navy"
                                title={passVisible ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                              >
                                {passVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(u.id, displayPass)}
                                className="text-muted hover:text-navy"
                                title="Salin kata sandi"
                              >
                                {copiedId === u.id ? (
                                  <Check className="h-3.5 w-3.5 text-success" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
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

                          <td className="px-5 py-3.5 font-semibold text-navy text-xs">
                            {u.assessmentCount} asesmen
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Tombol Edit / Reset Password */}
                              <button
                                id={`edit-user-${u.id}`}
                                type="button"
                                onClick={() => openEditModal(u)}
                                className="btn border border-line p-1.5 text-muted hover:border-brand/40 hover:text-brand hover:bg-brand-light"
                                title="Ubah data & kata sandi"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              {/* Tombol Toggle Status */}
                              <button
                                id={`toggle-status-${u.id}`}
                                type="button"
                                disabled={isActionLoading || isCurrentUser}
                                onClick={() => toggleStatus(u)}
                                className="btn border border-line py-1 px-2.5 text-xs text-navy hover:bg-canvas disabled:opacity-50"
                                title={u.status === "active" ? "Nonaktifkan akun" : "Aktifkan akun"}
                              >
                                {isActionLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : u.status === "active" ? (
                                  "Nonaktifkan"
                                ) : (
                                  "Aktifkan"
                                )}
                              </button>

                              {/* Tombol Hapus Akun */}
                              {!isCurrentUser && (
                                <button
                                  id={`delete-user-${u.id}`}
                                  type="button"
                                  onClick={() => setDeletingUser(u)}
                                  className="btn border border-danger/20 p-1.5 text-danger hover:bg-danger-light"
                                  title="Hapus akun"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RIWAYAT LOGIN & AUDIT LOG                               */}
      {/* ============================================================== */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={History} label="Total Percobaan Login" value={logStats.total} tone="navy" delay={0} />
            <StatCard icon={CheckCircle2} label="Login Berhasil" value={logStats.success} tone="success" delay={50} />
            <StatCard icon={ShieldAlert} label="Percobaan Gagal" value={logStats.failed} tone="warning" delay={100} />
          </div>

          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block w-full sm:w-72">
                  <span className="sr-only">Cari riwayat login</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="search-logs"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Cari username, IP, keterangan..."
                    className="input py-2 pl-9"
                  />
                </label>

                <select
                  id="filter-log-status"
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="input w-auto py-2 pr-8 text-xs font-semibold"
                >
                  <option value="all">Semua Status</option>
                  <option value="success">Hanya Berhasil</option>
                  <option value="failed">Hanya Gagal</option>
                </select>
              </div>

              <p className="text-xs font-semibold text-muted">
                Menampilkan {filteredLogs.length} dari {logs?.length ?? 0} catatan
              </p>
            </div>

            {!logs ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <EmptyState
                icon={History}
                title="Riwayat login belum tersedia"
                description="Aktivitas login terapis dan admin akan otomatis tercatat di sini."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-canvas/70 text-xs font-bold tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-5 py-3">Waktu & Tanggal</th>
                      <th className="px-5 py-3">Username & Akun</th>
                      <th className="px-5 py-3">Peran</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">IP Address / Jaringan</th>
                      <th className="px-5 py-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredLogs.map((l) => (
                      <tr key={l.id} className="transition hover:bg-brand-light/30">
                        <td className="px-5 py-3.5 text-xs font-medium text-navy">
                          {formatDate(l.timestamp)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-mono text-xs font-bold text-navy">@{l.username}</p>
                          {l.fullName && <p className="text-xs text-muted">{l.fullName}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={l.role === "admin" ? "warning" : "brand"}>
                            {l.role === "admin" ? "Administrator" : "Terapis Wicara"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          {l.status === "success" ? (
                            <Badge tone="success">
                              <CheckCircle2 className="h-3 w-3" /> Berhasil
                            </Badge>
                          ) : (
                            <Badge tone="danger">
                              <AlertCircle className="h-3 w-3" /> Gagal
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted">{l.ipAddress}</td>
                        <td className="px-5 py-3.5 text-xs text-muted">{l.message || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU                                  */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-fade-up">
          <div className="card w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-light text-brand">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-navy text-lg">Tambah Akun Terapis / Pengguna</h3>
                  <p className="text-xs text-muted">Buat kredensial login baru untuk terapis wicara atau staf.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-canvas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 pt-4">
              {addError && (
                <div className="rounded-xl border border-danger/20 bg-danger-light p-3 text-xs font-semibold text-danger">
                  {addError}
                </div>
              )}

              <div>
                <label className="label">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Kusuma, A.Md.Kes"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Username Login</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs font-bold text-muted">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="terapis.rina"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value.toLowerCase().replace(/\s+/g, "."))}
                      className="input pl-7 font-mono text-xs font-semibold"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">Digunakan saat login ke portal.</p>
                </div>

                <div>
                  <label className="label">Kata Sandi Awal</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                    <input
                      type="text"
                      required
                      placeholder="Masukkan kata sandi awal"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="input pl-8 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Email Resmi (Opsional)</label>
                <input
                  type="email"
                  placeholder={addUsername ? `${addUsername}@flunify.id` : "nama@poltekkes-solo.ac.id"}
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Peran Pengguna</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["therapist", "student", "admin"] as AccountType[]).map((type) => {
                    const active = addAccountType === type;
                    const meta = ROLE_LABELS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddAccountType(type)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl p-2.5 border text-center transition-all",
                          active
                            ? "border-brand bg-brand-light text-brand font-bold"
                            : "border-line text-muted hover:bg-canvas"
                        )}
                      >
                        <meta.icon className="h-4 w-4 mb-1" />
                        <span className="text-xs">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn border border-line bg-white hover:bg-canvas text-xs py-2 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {submittingAdd ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Simpan Akun Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UBAH DATA & RESET PASSWORD PENGGUNA                   */}
      {/* ============================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-fade-up">
          <div className="card w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-light text-brand">
                  <UserCog className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-navy text-lg">Ubah Data & Kredensial</h3>
                  <p className="text-xs text-muted">Sesuaikan username, kata sandi, peran, dan status akun.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-canvas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              {editError && (
                <div className="rounded-xl border border-danger/20 bg-danger-light p-3 text-xs font-semibold text-danger">
                  {editError}
                </div>
              )}

              <div>
                <label className="label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Username</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs font-bold text-muted">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, "."))}
                      className="input pl-7 font-mono text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Ubah / Reset Kata Sandi</label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                    <input
                      type="text"
                      placeholder="Masukkan sandi baru"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="input pl-8 font-mono text-xs"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">Biarkan jika tidak ingin mengubah password.</p>
                </div>
              </div>

              <div>
                <label className="label">Email Akun</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Peran</label>
                  <select
                    value={editAccountType}
                    onChange={(e) => setEditAccountType(e.target.value as AccountType)}
                    className="input text-xs"
                  >
                    <option value="therapist">Terapis Wicara</option>
                    <option value="student">Mahasiswa Praktik</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="label">Status Akun</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as AccountStatus)}
                    className="input text-xs"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn border border-line bg-white hover:bg-canvas text-xs py-2 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {submittingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: KONFIRMASI HAPUS PENGGUNA                             */}
      {/* ============================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-fade-up">
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-danger-light text-danger">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-navy text-lg">Konfirmasi Hapus Akun</h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun{" "}
                  <strong className="text-navy font-semibold">{deletingUser.fullName}</strong> (
                  <span className="font-mono text-brand font-bold">@{deletingUser.username || deletingUser.email}</span>
                  )? Pengguna ini tidak akan dapat login lagi ke sistem Flunify.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="btn border border-line bg-white hover:bg-canvas text-xs py-2 px-4"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingDelete}
                onClick={handleDeleteUser}
                className="btn bg-danger text-white hover:bg-danger/90 text-xs py-2 px-4 font-bold"
              >
                {submittingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
