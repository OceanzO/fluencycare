"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileAudio,
  Hash,
  Info,
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  User,
  Volume2,
} from "lucide-react";
import { Badge, FieldError, PageHeader, SectionCard } from "@/components/ui";
import { useSession } from "@/lib/auth/AuthContext";
import { useRepository } from "@/lib/data/useRepository";
import { cn, formatDuration, formatPercent, todayISO } from "@/lib/format";
import { computeSS, getSSISeverity, validateSS } from "@/lib/ss";
import type { MasterData, NewAssessmentInput } from "@/lib/types";

export function NewAssessmentView() {
  const router = useRouter();
  const session = useSession();
  const repo = useRepository();

  // Master Data (Tugas Bicara & Disfluency Types)
  const [masterData, setMasterData] = useState<MasterData | null>(null);

  // Form Fields - Step 1: Identitas Klien
  const [clientCode, setClientCode] = useState("");
  const [clientAge, setClientAge] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(todayISO());
  const [caseHistory, setCaseHistory] = useState("");

  // Form Fields - Step 2: Observasi Klinis
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedDisfluencies, setSelectedDisfluencies] = useState<string[]>([]);

  // Form Fields - Step 3: Perekaman Audio Bicara
  const [recorderState, setRecorderState] = useState<"idle" | "recording" | "paused" | "recorded">("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Form Fields - Step 4: Kalkulasi %SS & Catatan Klinis
  const [totalSyllables, setTotalSyllables] = useState("300");
  const [stutteredSyllables, setStutteredSyllables] = useState("18");
  const [therapistNotes, setTherapistNotes] = useState("");

  // State Pengiriman Formulir
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  // Muat Master Data
  useEffect(() => {
    let cancelled = false;
    repo
      .getMasterData()
      .then((data) => {
        if (!cancelled) {
          setMasterData(data);
          // Default pilihan awal agar terapis mudah mengobservasi
          if (data.speechTasks.length && selectedTasks.length === 0) {
            setSelectedTasks([data.speechTasks[0]]);
          }
          if (data.disfluencyTypes.length && selectedDisfluencies.length === 0) {
            setSelectedDisfluencies([data.disfluencyTypes[0]]);
          }
        }
      })
      .catch(() => {
        // Fallback default jika gagal memuat
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // Bersihkan URL audio saat unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [audioUrl]);

  // Validasi %SS secara real-time
  const ssValidation = useMemo(() => {
    return validateSS(totalSyllables, stutteredSyllables);
  }, [totalSyllables, stutteredSyllables]);

  const currentSSPercentage = ssValidation.percentage ?? 0;
  const severityInfo = useMemo(() => {
    return getSSISeverity(currentSSPercentage);
  }, [currentSSPercentage]);

  // Toggle pilihan Tugas Bicara
  const toggleSpeechTask = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  // Toggle pilihan Jenis Ketidaklancaran
  const toggleDisfluency = (dis: string) => {
    setSelectedDisfluencies((prev) =>
      prev.includes(dis) ? prev.filter((d) => d !== dis) : [...prev, dis]
    );
  };

  // Generate Kode Klien Acak (misal C001, C002, dll)
  const generateRandomCode = () => {
    const num = Math.floor(Math.random() * 900) + 100;
    setClientCode(`C${num}`);
  };

  // -------------------------------------------------------------
  // Logika Perekaman Audio Bicara (Web MediaRecorder API)
  // -------------------------------------------------------------
  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // potong per 250ms
      setRecorderState("recording");
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      setMicError(
        "Tidak dapat mengakses mikrofon. Pastikan Anda telah mengizinkan akses mikrofon di peramban web."
      );
      setRecorderState("idle");
    }
  }

  function pauseRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecorderState("paused");
    }
  }

  function resumeRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecorderState("recording");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecorderState("recorded");
    }
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setRecorderState("idle");
    setMicError(null);
  }

  // -------------------------------------------------------------
  // Submit Formulir Asesmen Lengkap
  // -------------------------------------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSubmitError(null);

    // Validasi
    if (!clientCode.trim()) {
      setSubmitError("Kode klien wajib diisi atau buat menggunakan tombol 'Acak Kode'.");
      return;
    }

    const ageNum = Number(clientAge);
    if (!clientAge || Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setSubmitError("Usia klien harus berupa bilangan bulat antara 1 hingga 120 tahun.");
      return;
    }

    if (selectedTasks.length === 0) {
      setSubmitError("Pilih minimal 1 tugas bicara yang diobservasi pada sesi ini.");
      return;
    }

    if (selectedDisfluencies.length === 0) {
      setSubmitError("Pilih minimal 1 jenis ketidaklancaran yang teramati.");
      return;
    }

    if (!ssValidation.valid || ssValidation.total === null || ssValidation.stuttered === null) {
      setSubmitError(
        ssValidation.errors.total ||
          ssValidation.errors.stuttered ||
          "Data perhitungan suku kata (%SS) belum valid."
      );
      return;
    }

    // Jika sedang merekam, hentikan perekam terlebih dahulu
    if (recorderState === "recording" || recorderState === "paused") {
      stopRecording();
    }

    setSubmitting(true);
    try {
      const input: NewAssessmentInput = {
        clientCode: clientCode.trim().toUpperCase(),
        clientAge: ageNum,
        assessmentDate,
        caseHistory: caseHistory.trim(),
        speechTasks: selectedTasks,
        disfluencyTypes: selectedDisfluencies,
        totalSyllables: ssValidation.total,
        stutteredSyllables: ssValidation.stuttered,
        therapistNotes: therapistNotes.trim(),
        audioBlob,
        audioDurationSeconds: recordingSeconds,
      };

      await repo.createAssessment(input, session.user);
      setSuccessSaved(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Gagal menyimpan data asesmen.");
      setSubmitting(false);
    }
  }

  // Opsi Tugas Bicara & Disfluency dari Master Data
  const speechTaskOptions = masterData?.speechTasks ?? [
    "Bicara spontan",
    "Bercerita",
    "Menjawab pertanyaan",
    "Membaca",
  ];

  const disfluencyOptions = masterData?.disfluencyTypes ?? [
    "Pengulangan bunyi/suku kata",
    "Pengulangan kata utuh",
    "Pengulangan frasa",
    "Pemanjangan bunyi (prolongation)",
    "Blocking",
    "Interjeksi / jeda",
    "Perilaku penyerta",
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Link href="/dashboard" className="transition hover:text-navy">
          Dashboard Klinis
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-brand">Asesmen Baru</span>
      </nav>

      {/* Header Halaman */}
      <PageHeader
        eyebrow="Dokumentasi Klinis"
        title="Mulai Asesmen Baru"
        description="Catat observasi ketidaklancaran, rekam sampel bicara, dan hitung persentase %SS secara akurat sesuai kaidah terapi wicara."
        actions={
          <Link href="/dashboard" className="btn border border-line bg-white hover:bg-canvas text-xs py-2 px-3.5">
            <ArrowLeft className="h-4 w-4" /> Batal & Kembali
          </Link>
        }
      />

      {/* Banner Notifikasi Berhasil */}
      {successSaved && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-light p-5 text-success animate-fade-up shadow-sm"
        >
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold text-base">Asesmen Berhasil Disimpan!</p>
            <p className="text-xs text-success/80 mt-0.5">
              Data klien {clientCode.toUpperCase()} telah tercatat ke dalam sistem. Mengarahkan kembali ke dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Banner Error Pengiriman */}
      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-light p-4 text-sm text-danger animate-fade-up"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Mohon periksa kembali formulir:</p>
            <p className="text-xs mt-0.5 leading-relaxed">{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* ========================================================== */}
        {/* LANGKAH 1: IDENTITAS KLIEN & ANAMNESIS KASUS               */}
        {/* ========================================================== */}
        <SectionCard
          step={1}
          icon={User}
          title="Identitas Klien & Riwayat Kasus"
          description="Kode identifikasi anonim pasien untuk menjaga kerahasiaan rekam medis."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="client-code" className="label mb-0">
                  Kode Klien <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Acak Kode
                </button>
              </div>
              <div className="relative">
                <Hash className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="client-code"
                  type="text"
                  required
                  placeholder="Contoh: C005"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  className="input pl-9 font-bold tracking-wider"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">Kode pengenal rekam medis tanpa nama asli.</p>
            </div>

            <div>
              <label htmlFor="client-age" className="label">
                Usia Klien (Tahun) <span className="text-danger">*</span>
              </label>
              <input
                id="client-age"
                type="number"
                min="1"
                max="120"
                required
                placeholder="Contoh: 7"
                value={clientAge}
                onChange={(e) => setClientAge(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="assessment-date" className="label">
                Tanggal Asesmen <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="assessment-date"
                  type="date"
                  required
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="input pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="case-history" className="label">
              Riwayat Kasus & Onset Keluhan (Anamnesis)
            </label>
            <textarea
              id="case-history"
              rows={3}
              placeholder="Catat riwayat awal munculnya ketidaklancaran bicara, situasi yang memperparah, respons keluarga, atau terapi sebelumnya..."
              value={caseHistory}
              onChange={(e) => setCaseHistory(e.target.value)}
              className="input leading-relaxed"
            />
          </div>
        </SectionCard>

        {/* ========================================================== */}
        {/* LANGKAH 2: OBSERVASI KLINIS & CHECKLIST DISFLUENCY         */}
        {/* ========================================================== */}
        <SectionCard
          step={2}
          icon={ClipboardList}
          title="Observasi Ketidaklancaran (Disfluency Observations)"
          description="Pilih tugas bicara yang diberikan dan gejala disfluency yang teramati selama sesi."
        >
          {/* Pilihan Tugas Bicara */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                Tugas Bicara yang Diobservasi <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-muted font-medium">{selectedTasks.length} tugas dipilih</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {speechTaskOptions.map((task) => {
                const active = selectedTasks.includes(task);
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleSpeechTask(task)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 border",
                      active
                        ? "bg-brand text-white border-brand shadow-sm shadow-brand/25"
                        : "bg-white text-navy border-line hover:border-brand/40 hover:bg-brand-light/30"
                    )}
                  >
                    {active ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted" />}
                    {task}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pilihan Jenis Disfluency */}
          <div className="mt-5 pt-5 border-t border-line">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">
                Jenis Ketidaklancaran yang Teramati <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-muted font-medium">{selectedDisfluencies.length} gejala teramati</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {disfluencyOptions.map((dis) => {
                const active = selectedDisfluencies.includes(dis);
                return (
                  <button
                    key={dis}
                    type="button"
                    onClick={() => toggleDisfluency(dis)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs text-left font-semibold transition-all duration-200 border",
                      active
                        ? "bg-navy/5 text-navy border-navy/30 font-bold"
                        : "bg-white text-muted border-line hover:border-brand/40 hover:text-navy hover:bg-canvas"
                    )}
                  >
                    <span>{dis}</span>
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-md border text-[11px]",
                        active ? "border-brand bg-brand text-white" : "border-line bg-canvas text-transparent"
                      )}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ========================================================== */}
        {/* LANGKAH 3: PEREKAMAN SAMPEL BICARA (AUDIO RECORDER)        */}
        {/* ========================================================== */}
        <SectionCard
          step={3}
          icon={Mic}
          title="Perekaman Sampel Bicara (Speech Recording)"
          description="Rekam audio percakapan atau tugas bicara langsung melalui mikrofon perangkat."
        >
          {micError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-light p-3.5 text-xs text-warning">
              <MicOff className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{micError}</span>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-gradient-to-b from-canvas/40 to-canvas p-6 text-center">
            {/* Status & Durasi */}
            <div className="flex items-center justify-center gap-3">
              {recorderState === "recording" && (
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-danger" />
                </span>
              )}
              <span className="font-mono text-3xl font-extrabold tracking-wider text-navy">
                {formatDuration(recordingSeconds)}
              </span>
              {recorderState === "recording" && (
                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger uppercase tracking-wide">
                  Merekam...
                </span>
              )}
              {recorderState === "paused" && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning uppercase tracking-wide">
                  Dijeda
                </span>
              )}
              {recorderState === "recorded" && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase tracking-wide">
                  Tersimpan
                </span>
              )}
            </div>

            {/* Visual Gelombang Sederhana Saat Merekam */}
            {recorderState === "recording" && (
              <div className="my-5 flex items-center justify-center gap-1.5 h-10">
                {[40, 75, 55, 90, 60, 30, 85, 70, 95, 45, 65, 80, 50, 70, 90].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-brand animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 60}ms`,
                      animationDuration: "800ms",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Tombol Kontrol Perekam */}
            <div className="mt-5 flex items-center justify-center gap-3">
              {recorderState === "idle" && (
                <button
                  id="btn-start-record"
                  type="button"
                  onClick={startRecording}
                  className="btn-primary text-xs py-2.5 px-5 shadow-md shadow-brand/25"
                >
                  <Mic className="h-4 w-4" /> Mulai Rekam Audio
                </button>
              )}

              {recorderState === "recording" && (
                <>
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="btn border border-line bg-white hover:bg-canvas text-xs py-2.5 px-4 text-navy"
                  >
                    <Pause className="h-4 w-4" /> Jeda
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="btn bg-danger text-white hover:bg-danger/90 text-xs py-2.5 px-5 font-bold shadow-md shadow-danger/20"
                  >
                    <Square className="h-4 w-4 fill-white" /> Selesai Merekam
                  </button>
                </>
              )}

              {recorderState === "paused" && (
                <>
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="btn-primary text-xs py-2.5 px-4"
                  >
                    <Play className="h-4 w-4" /> Lanjutkan
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="btn bg-danger text-white hover:bg-danger/90 text-xs py-2.5 px-5 font-bold"
                  >
                    <Square className="h-4 w-4 fill-white" /> Selesai
                  </button>
                </>
              )}

              {recorderState === "recorded" && (
                <button
                  type="button"
                  onClick={resetRecording}
                  className="btn border border-line bg-white hover:bg-canvas text-xs py-2 px-4 text-muted hover:text-navy"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rekam Ulang
                </button>
              )}
            </div>

            {/* Audio Preview Playback */}
            {audioUrl && (
              <div className="mt-5 mx-auto max-w-md rounded-xl border border-line bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-bold text-navy flex items-center justify-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-brand" /> Putar Pratinjau Rekaman
                </p>
                <audio src={audioUrl} controls className="w-full h-9" />
              </div>
            )}
          </div>
        </SectionCard>

        {/* ========================================================== */}
        {/* LANGKAH 4: KALKULATOR %SS & CATATAN KLINIS                 */}
        {/* ========================================================== */}
        <SectionCard
          step={4}
          icon={Activity}
          title="Penghitungan Formula %SS & Catatan Klinis"
          description="Formula otomatis persentase suku kata gagap: %SS = (Suku Kata Gagap / Total Suku Kata) × 100."
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
            {/* Input Suku Kata */}
            <div className="space-y-4">
              <div>
                <label htmlFor="total-syllables" className="label">
                  Total Seluruh Suku Kata Diucapkan <span className="text-danger">*</span>
                </label>
                <input
                  id="total-syllables"
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 300"
                  value={totalSyllables}
                  onChange={(e) => setTotalSyllables(e.target.value)}
                  className="input font-bold"
                />
                <p className="mt-1 text-[11px] text-muted">Standar sampel bicara umumnya 200–500 suku kata.</p>
              </div>

              <div>
                <label htmlFor="stuttered-syllables" className="label">
                  Jumlah Suku Kata Gagap / Disfluency <span className="text-danger">*</span>
                </label>
                <input
                  id="stuttered-syllables"
                  type="number"
                  min="0"
                  required
                  placeholder="Contoh: 18"
                  value={stutteredSyllables}
                  onChange={(e) => setStutteredSyllables(e.target.value)}
                  className="input font-bold text-brand"
                />
              </div>

              <div>
                <label htmlFor="therapist-notes" className="label">
                  Catatan Observasi Terapis & Rekomendasi
                </label>
                <textarea
                  id="therapist-notes"
                  rows={3}
                  placeholder="Catat perilaku penyerta fisik (e.g. kedipan mata, ketegangan leher), fluktuasi kecepatan bicara, dan rencana terapi berikutnya..."
                  value={therapistNotes}
                  onChange={(e) => setTherapistNotes(e.target.value)}
                  className="input leading-relaxed"
                />
              </div>
            </div>

            {/* Live Calculation Display Panel */}
            <div className="rounded-2xl border border-line bg-gradient-to-br from-white to-brand-light/20 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide uppercase text-muted">Hasil Kalkulasi %SS</span>
                  <Badge tone={severityInfo.tone}>{severityInfo.label}</Badge>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-5xl font-black tracking-tight text-navy">
                    {formatPercent(currentSSPercentage)}
                  </span>
                  <p className="mt-1 font-mono text-xs text-muted">
                    ({stutteredSyllables || 0} / {totalSyllables || 0}) × 100%
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-line bg-white/80 p-3 text-xs leading-relaxed text-muted">
                  <p className="font-bold text-navy mb-0.5">Panduan Klinis SSI:</p>
                  <p>{severityInfo.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-line text-[11px] text-muted flex items-center gap-1.5">
                <Info className="h-4 w-4 shrink-0 text-brand" />
                <span>Kalkulasi disimpan otomatis ke rekam medis pasien.</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Tombol Aksi Simpan */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
          <Link
            href="/dashboard"
            className="btn border border-line bg-white hover:bg-canvas text-xs py-2.5 px-5 text-muted hover:text-navy font-bold"
          >
            Batal
          </Link>

          <button
            id="btn-submit-assessment"
            type="submit"
            disabled={submitting || successSaved}
            className="btn-primary text-xs py-2.5 px-6 font-bold shadow-lg shadow-brand/25"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan Asesmen...
              </>
            ) : successSaved ? (
              <>
                <Check className="h-4 w-4" /> Berhasil Disimpan
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Simpan Dokumen Asesmen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
