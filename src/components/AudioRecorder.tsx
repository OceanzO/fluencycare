"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Mic, MicOff, RotateCcw, Square, Trash2 } from "lucide-react";
import { cn, formatBytes, formatDuration } from "@/lib/format";

export interface RecordingValue {
  blob: Blob;
  durationSeconds: number;
}

type Status = "idle" | "requesting" | "recording" | "recorded" | "error";

const MAX_SECONDS = 10 * 60;
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

function micErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Izin mikrofon ditolak. Izinkan akses mikrofon pada pengaturan peramban lalu coba lagi.";
  if (name === "NotFoundError") return "Mikrofon tidak ditemukan. Pastikan perangkat mikrofon terhubung.";
  if (name === "NotReadableError") return "Mikrofon sedang dipakai aplikasi lain.";
  return "Tidak dapat memulai perekaman. Coba muat ulang halaman.";
}

export function AudioRecorder({ value, onChange }: { value: RecordingValue | null; onChange: (v: RecordingValue | null) => void }) {
  const [status, setStatus] = useState<Status>(value ? "recorded" : "idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  }, []);

  // Buat / bersihkan object URL untuk pemutar audio.
  useEffect(() => {
    if (!value) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.blob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const teardown = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
  }, []);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    teardown();
  }, [teardown]);

  const drawLevels = useCallback((analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const bars = 40;

    const render = () => {
      analyser.getByteFrequencyData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const gap = 3;
      const barW = (width - gap * (bars - 1)) / bars;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * data.length * 0.7)] / 255;
        const h = Math.max(4, v * height);
        ctx.fillStyle = `rgba(66, 103, 178, ${0.35 + v * 0.65})`;
        const x = i * (barW + gap);
        ctx.beginPath();
        ctx.roundRect(x, (height - h) / 2, barW, h, 3);
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationSeconds = Math.round((performance.now() - startRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        teardown();
        if (blob.size === 0) {
          setStatus("error");
          setError("Rekaman kosong. Coba rekam ulang.");
          return;
        }
        onChange({ blob, durationSeconds });
        setStatus("recorded");
      };

      // Visualisasi level suara.
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        audioCtx.createMediaStreamSource(stream).connect(analyser);
        requestAnimationFrame(() => drawLevels(analyser));
      }

      recorder.start(1000);
      startRef.current = performance.now();
      setElapsed(0);
      setStatus("recording");
      timerRef.current = window.setInterval(() => {
        const secs = (performance.now() - startRef.current) / 1000;
        setElapsed(secs);
        if (secs >= MAX_SECONDS) stop();
      }, 250);
    } catch (err) {
      teardown();
      setStatus("error");
      setError(micErrorMessage(err));
    }
  }, [drawLevels, onChange, stop, teardown]);

  const discard = useCallback(() => {
    onChange(null);
    setElapsed(0);
    setStatus("idle");
  }, [onChange]);

  if (!supported) {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-light p-4 text-sm text-warning">
        <MicOff className="mt-0.5 h-5 w-5 shrink-0" />
        Peramban ini tidak mendukung perekaman audio (MediaRecorder API). Gunakan Chrome, Edge, Firefox, atau Safari versi terbaru melalui HTTPS/localhost.
      </div>
    );
  }

  const isRecording = status === "recording";

  return (
    <div className="rounded-2xl border border-line bg-canvas/50 p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        {/* Tombol utama */}
        <div className="relative">
          {status === "recorded" ? (
            <button
              id="record-again"
              type="button"
              onClick={() => {
                discard();
                void start();
              }}
              className="grid h-20 w-20 place-items-center rounded-full bg-white text-brand shadow-card ring-1 ring-line transition hover:scale-105 hover:shadow-lift"
              aria-label="Rekam ulang"
            >
              <RotateCcw className="h-7 w-7" />
            </button>
          ) : (
            <button
              id={isRecording ? "record-stop" : "record-start"}
              type="button"
              onClick={isRecording ? stop : () => void start()}
              disabled={status === "requesting"}
              aria-label={isRecording ? "Hentikan rekaman" : "Mulai rekam"}
              className={cn(
                "grid h-20 w-20 place-items-center rounded-full text-white shadow-lift transition hover:scale-105 disabled:opacity-60",
                isRecording ? "bg-danger animate-pulse-ring" : "bg-brand hover:bg-brand-dark",
              )}
            >
              {status === "requesting" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : isRecording ? (
                <Square className="h-6 w-6 fill-current" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          )}
        </div>

        <div className="w-full min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-navy">
              {status === "idle" && "Siap merekam sampel bicara"}
              {status === "requesting" && "Meminta izin mikrofon..."}
              {isRecording && (
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-danger" /> Sedang merekam
                </span>
              )}
              {status === "recorded" && "Rekaman tersimpan sementara"}
              {status === "error" && "Perekaman gagal"}
            </p>
            <span className={cn("font-mono text-lg font-bold tabular-nums", isRecording ? "text-danger" : "text-navy")}>
              {formatDuration(status === "recorded" && value ? value.durationSeconds : elapsed)}
            </span>
          </div>

          {isRecording && <canvas ref={canvasRef} width={480} height={48} className="h-12 w-full" aria-hidden="true" />}

          {status === "idle" && (
            <p className="text-xs text-muted">
              Tekan tombol mikrofon untuk mulai. Maksimal {MAX_SECONDS / 60} menit per sampel. Rekaman dapat diputar ulang sebelum disimpan.
            </p>
          )}

          {status === "recorded" && value && audioUrl && (
            <div className="space-y-2">
              <audio id="audio-playback" controls src={audioUrl} className="h-10 w-full" />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {value.blob.type.split(";")[0] || "audio"} · {formatBytes(value.blob.size)}
                </span>
                <button id="record-delete" type="button" onClick={discard} className="inline-flex items-center gap-1 font-semibold text-danger hover:underline">
                  <Trash2 className="h-3.5 w-3.5" /> Hapus rekaman
                </button>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-1 flex items-start gap-1.5 text-xs font-medium text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
