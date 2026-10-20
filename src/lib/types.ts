/** Peran tampilan aplikasi. Mahasiswa memakai tampilan "therapist". */
export type Role = "therapist" | "admin";

/** Sumber sesi: Mode Demo (cookie lokal) atau Supabase Auth. */
export type AuthMode = "demo" | "supabase";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  title: string;
  /** Peran akun = hak akses tertinggi yang dimiliki pengguna. */
  role: Role;
}

export interface Session {
  user: AppUser;
  /** Peran yang sedang aktif ditampilkan (Mode Terapis / Mode Admin). */
  activeRole: Role;
  mode: AuthMode;
}

export interface AudioMeta {
  durationSeconds: number;
  sizeBytes: number;
  /** Path di Supabase Storage bucket `audio_samples`; null di Mode Demo. */
  fileReference: string | null;
}

export interface Assessment {
  id: string;
  clientCode: string;
  clientAge: number;
  /** Format YYYY-MM-DD */
  assessmentDate: string;
  caseHistory: string;
  speechTasks: string[];
  disfluencyTypes: string[];
  totalSyllables: number;
  stutteredSyllables: number;
  ssPercentage: number;
  therapistNotes: string;
  audio: AudioMeta | null;
  therapistName: string;
  createdAt: string;
}

export interface NewAssessmentInput {
  clientCode: string;
  clientAge: number;
  assessmentDate: string;
  caseHistory: string;
  speechTasks: string[];
  disfluencyTypes: string[];
  totalSyllables: number;
  stutteredSyllables: number;
  therapistNotes: string;
  audioBlob: Blob | null;
  audioDurationSeconds: number;
}

export type AccountType = "therapist" | "student" | "admin";
export type AccountStatus = "active" | "inactive";

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  accountType: AccountType;
  status: AccountStatus;
  assessmentCount: number;
  createdAt: string;
}

export interface MasterData {
  speechTasks: string[];
  disfluencyTypes: string[];
}

export interface StorageUsage {
  bytes: number;
  files: number;
}
