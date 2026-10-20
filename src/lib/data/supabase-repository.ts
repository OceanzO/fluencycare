import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_MASTER_DATA } from "../constants";
import { AUDIO_BUCKET } from "../env";
import { computeSS } from "../ss";
import type { Assessment, ManagedUser, MasterData } from "../types";
import type { Repository } from "./repository";

interface AssessmentRow {
  id: string;
  assessment_date: string;
  case_history: string;
  therapist_notes: string;
  total_syllables: number;
  stuttered_syllables: number;
  ss_percentage: number | string;
  created_at: string;
  clients: { client_code: string; age: number } | null;
  profiles: { full_name: string } | null;
  observations: { category: "speech_task" | "disfluency"; label: string }[];
  audio_recordings: { file_reference: string; duration_seconds: number; size_bytes: number }[];
}

const ASSESSMENT_SELECT = `
  id, assessment_date, case_history, therapist_notes, total_syllables, stuttered_syllables,
  ss_percentage, created_at,
  clients ( client_code, age ),
  profiles ( full_name ),
  observations ( category, label ),
  audio_recordings ( file_reference, duration_seconds, size_bytes )
`;

function mapAssessment(row: AssessmentRow): Assessment {
  const audio = row.audio_recordings?.[0];
  return {
    id: row.id,
    clientCode: row.clients?.client_code ?? "-",
    clientAge: row.clients?.age ?? 0,
    assessmentDate: row.assessment_date,
    caseHistory: row.case_history,
    speechTasks: row.observations.filter((o) => o.category === "speech_task").map((o) => o.label),
    disfluencyTypes: row.observations.filter((o) => o.category === "disfluency").map((o) => o.label),
    totalSyllables: row.total_syllables,
    stutteredSyllables: row.stuttered_syllables,
    ssPercentage: Number(row.ss_percentage),
    therapistNotes: row.therapist_notes,
    audio: audio
      ? { durationSeconds: audio.duration_seconds, sizeBytes: Number(audio.size_bytes), fileReference: audio.file_reference }
      : null,
    therapistName: row.profiles?.full_name ?? "-",
    createdAt: row.created_at,
  };
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "Terjadi kesalahan."}`);
}

/** Backend Supabase — mengikuti skema di supabase/schema.sql (RLS menentukan data yang terlihat). */
export function createSupabaseRepository(supabase: SupabaseClient): Repository {
  return {
    async listAssessments() {
      const { data, error } = await supabase
        .from("assessments")
        .select(ASSESSMENT_SELECT)
        .order("created_at", { ascending: false });
      if (error) fail("Gagal memuat asesmen", error);
      return (data as unknown as AssessmentRow[]).map(mapAssessment);
    },

    async createAssessment(input, user) {
      // 1. Klien (upsert berdasarkan kode klien — tanpa nama asli demi privasi).
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .upsert({ client_code: input.clientCode, age: input.clientAge }, { onConflict: "client_code" })
        .select("id")
        .single();
      if (clientError || !client) fail("Gagal menyimpan data klien", clientError);

      // 2. Asesmen (ss_percentage dihitung otomatis oleh kolom generated di database).
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          client_id: client.id,
          therapist_id: user.id,
          assessment_date: input.assessmentDate,
          case_history: input.caseHistory,
          therapist_notes: input.therapistNotes,
          total_syllables: input.totalSyllables,
          stuttered_syllables: input.stutteredSyllables,
        })
        .select("id, created_at")
        .single();
      if (assessmentError || !assessment) fail("Gagal menyimpan asesmen", assessmentError);

      // 3. Observasi (tugas bicara + jenis ketidaklancaran).
      const observations = [
        ...input.speechTasks.map((label) => ({ assessment_id: assessment.id, category: "speech_task", label })),
        ...input.disfluencyTypes.map((label) => ({ assessment_id: assessment.id, category: "disfluency", label })),
      ];
      if (observations.length) {
        const { error } = await supabase.from("observations").insert(observations);
        if (error) fail("Gagal menyimpan observasi", error);
      }

      // 4. Audio → Storage bucket privat, metadata → tabel audio_recordings.
      let audio: Assessment["audio"] = null;
      if (input.audioBlob) {
        const ext = input.audioBlob.type.includes("mp4") ? "m4a" : input.audioBlob.type.includes("ogg") ? "ogg" : "webm";
        const path = `${user.id}/${assessment.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(AUDIO_BUCKET)
          .upload(path, input.audioBlob, { contentType: input.audioBlob.type || "audio/webm", upsert: false });
        if (uploadError) fail("Asesmen tersimpan, tetapi unggah audio gagal", uploadError);

        const { error } = await supabase.from("audio_recordings").insert({
          assessment_id: assessment.id,
          file_reference: path,
          duration_seconds: Math.round(input.audioDurationSeconds),
          size_bytes: input.audioBlob.size,
          mime_type: input.audioBlob.type,
        });
        if (error) fail("Gagal menyimpan metadata audio", error);
        audio = { durationSeconds: input.audioDurationSeconds, sizeBytes: input.audioBlob.size, fileReference: path };
      }

      return {
        id: assessment.id,
        clientCode: input.clientCode,
        clientAge: input.clientAge,
        assessmentDate: input.assessmentDate,
        caseHistory: input.caseHistory,
        speechTasks: input.speechTasks,
        disfluencyTypes: input.disfluencyTypes,
        totalSyllables: input.totalSyllables,
        stutteredSyllables: input.stutteredSyllables,
        ssPercentage: computeSS(input.stutteredSyllables, input.totalSyllables),
        therapistNotes: input.therapistNotes,
        audio,
        therapistName: user.fullName,
        createdAt: assessment.created_at,
      };
    },

    async listUsers() {
      const [{ data: profiles, error }, { data: counts }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, account_type, status, created_at").order("created_at"),
        supabase.from("assessments").select("therapist_id"),
      ]);
      if (error) fail("Gagal memuat pengguna", error);
      const tally = new Map<string, number>();
      (counts ?? []).forEach((r: { therapist_id: string }) => tally.set(r.therapist_id, (tally.get(r.therapist_id) ?? 0) + 1));
      return (profiles ?? []).map(
        (p): ManagedUser => ({
          id: p.id,
          fullName: p.full_name,
          email: p.email,
          accountType: p.account_type,
          status: p.status,
          assessmentCount: tally.get(p.id) ?? 0,
          createdAt: p.created_at,
        }),
      );
    },

    // Membuat akun auth baru membutuhkan service role key (server-side) — undang lewat Supabase Dashboard.
    addUser: null,

    async updateUserStatus(id, status) {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) fail("Gagal memperbarui status", error);
    },

    async getMasterData() {
      const { data, error } = await supabase
        .from("master_options")
        .select("category, label, sort_order")
        .order("sort_order");
      if (error) fail("Gagal memuat master data", error);
      if (!data?.length) return DEFAULT_MASTER_DATA;
      return {
        speechTasks: data.filter((d) => d.category === "speech_task").map((d) => d.label),
        disfluencyTypes: data.filter((d) => d.category === "disfluency").map((d) => d.label),
      };
    },

    async saveMasterData(master: MasterData) {
      const { error: deleteError } = await supabase.from("master_options").delete().in("category", ["speech_task", "disfluency"]);
      if (deleteError) fail("Gagal memperbarui master data", deleteError);
      const rows = [
        ...master.speechTasks.map((label, i) => ({ category: "speech_task", label, sort_order: i })),
        ...master.disfluencyTypes.map((label, i) => ({ category: "disfluency", label, sort_order: i })),
      ];
      const { error } = await supabase.from("master_options").insert(rows);
      if (error) fail("Gagal menyimpan master data", error);
    },

    async getStorageUsage() {
      const { data, error } = await supabase.from("audio_recordings").select("size_bytes");
      if (error) fail("Gagal memuat penggunaan penyimpanan", error);
      return {
        files: data?.length ?? 0,
        bytes: (data ?? []).reduce((sum, r: { size_bytes: number }) => sum + Number(r.size_bytes), 0),
      };
    },
  };
}
