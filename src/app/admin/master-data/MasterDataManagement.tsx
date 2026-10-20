"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ListChecks,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { Badge, PageHeader, Skeleton } from "@/components/ui";
import { DEFAULT_MASTER_DATA } from "@/lib/constants";
import { useRepository } from "@/lib/data/useRepository";
import type { MasterData } from "@/lib/types";

export function MasterDataManagement() {
  const repo = useRepository();
  const [data, setData] = useState<MasterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New item inputs
  const [newTask, setNewTask] = useState("");
  const [newDisfluency, setNewDisfluency] = useState("");

  useEffect(() => {
    let cancelled = false;
    repo
      .getMasterData()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [repo]);

  function addTask() {
    if (!newTask.trim() || !data) return;
    if (data.speechTasks.includes(newTask.trim())) {
      setError("Tugas bicara ini sudah ada dalam daftar.");
      return;
    }
    setData({
      ...data,
      speechTasks: [...data.speechTasks, newTask.trim()],
    });
    setNewTask("");
    setError(null);
  }

  function removeTask(index: number) {
    if (!data) return;
    setData({
      ...data,
      speechTasks: data.speechTasks.filter((_, i) => i !== index),
    });
  }

  function addDisfluency() {
    if (!newDisfluency.trim() || !data) return;
    if (data.disfluencyTypes.includes(newDisfluency.trim())) {
      setError("Jenis ketidaklancaran ini sudah ada dalam daftar.");
      return;
    }
    setData({
      ...data,
      disfluencyTypes: [...data.disfluencyTypes, newDisfluency.trim()],
    });
    setNewDisfluency("");
    setError(null);
  }

  function removeDisfluency(index: number) {
    if (!data) return;
    setData({
      ...data,
      disfluencyTypes: data.disfluencyTypes.filter((_, i) => i !== index),
    });
  }

  function resetToDefault() {
    if (confirm("Kembalikan daftar checklist ke bawaan klinis standar?")) {
      setData(DEFAULT_MASTER_DATA);
      setSuccess("Telah dikembalikan ke setelan bawaan. Klik Simpan untuk mempermanenkan.");
    }
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await repo.saveMasterData(data);
      setSuccess("Master data berhasil disimpan.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan master data.");
    } finally {
      setSaving(false);
    }
  }

  const isLoading = data === null;

  return (
    <>
      <PageHeader
        eyebrow="Administrasi"
        title="Master Data Klinis"
        description="Kelola parameter checklist tugas bicara dan jenis ketidaklancaran yang digunakan terapis saat observasi asesmen."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetToDefault}
              disabled={isLoading || saving}
              className="btn border border-line hover:bg-canvas"
            >
              <RotateCcw className="h-4 w-4" /> Reset Default
            </button>
            <button
              id="save-master-data"
              type="button"
              onClick={handleSave}
              disabled={isLoading || saving}
              className="btn-primary"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
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

      {success && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2 rounded-xl border border-success/20 bg-success-light p-4 text-sm text-success"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Section 1: Tugas Bicara */}
          <section className="card p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Tugas Bicara (Speech Tasks)</h2>
                <p className="text-xs text-muted">Aktivitas yang diberikan kepada klien saat observasi.</p>
              </div>
              <Badge tone="brand">{data.speechTasks.length} tugas</Badge>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                id="input-new-task"
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())}
                placeholder="Tambah tugas bicara baru..."
                className="input py-2 text-sm"
              />
              <button
                type="button"
                onClick={addTask}
                className="btn-primary shrink-0 py-2"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {data.speechTasks.map((task, idx) => (
                <li
                  key={task + idx}
                  className="flex items-center justify-between rounded-xl bg-canvas p-3 ring-1 ring-line"
                >
                  <span className="text-sm font-semibold text-navy">{task}</span>
                  <button
                    type="button"
                    onClick={() => removeTask(idx)}
                    className="rounded-lg p-1 text-muted hover:bg-danger-light hover:text-danger"
                    aria-label={`Hapus ${task}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2: Jenis Ketidaklancaran */}
          <section className="card p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Jenis Ketidaklancaran (Disfluency)</h2>
                <p className="text-xs text-muted">Karakteristik gagap yang diamati selama pengujian.</p>
              </div>
              <Badge tone="warning">{data.disfluencyTypes.length} tipe</Badge>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                id="input-new-disfluency"
                type="text"
                value={newDisfluency}
                onChange={(e) => setNewDisfluency(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDisfluency())}
                placeholder="Tambah tipe disfluensi baru..."
                className="input py-2 text-sm"
              />
              <button
                type="button"
                onClick={addDisfluency}
                className="btn-primary shrink-0 py-2"
              >
                <Plus className="h-4 w-4" /> Tambah
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {data.disfluencyTypes.map((type, idx) => (
                <li
                  key={type + idx}
                  className="flex items-center justify-between rounded-xl bg-canvas p-3 ring-1 ring-line"
                >
                  <span className="text-sm font-semibold text-navy">{type}</span>
                  <button
                    type="button"
                    onClick={() => removeDisfluency(idx)}
                    className="rounded-lg p-1 text-muted hover:bg-danger-light hover:text-danger"
                    aria-label={`Hapus ${type}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
