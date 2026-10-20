import { DEFAULT_MASTER_DATA, DEMO_USERS } from "../constants";
import { computeSS } from "../ss";
import type { Assessment, ManagedUser } from "../types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function seedAssessment(
  id: string,
  clientCode: string,
  clientAge: number,
  ago: number,
  total: number,
  stuttered: number,
  tasks: number[],
  disfluencies: number[],
  caseHistory: string,
  durationSeconds: number,
): Assessment {
  const date = daysAgo(ago);
  return {
    id,
    clientCode,
    clientAge,
    assessmentDate: date,
    caseHistory,
    speechTasks: tasks.map((i) => DEFAULT_MASTER_DATA.speechTasks[i]),
    disfluencyTypes: disfluencies.map((i) => DEFAULT_MASTER_DATA.disfluencyTypes[i]),
    totalSyllables: total,
    stutteredSyllables: stuttered,
    ssPercentage: computeSS(stuttered, total),
    therapistNotes: "",
    audio: { durationSeconds, sizeBytes: durationSeconds * 6_000, fileReference: null },
    therapistName: DEMO_USERS.therapist.fullName,
    createdAt: `${date}T09:30:00.000Z`,
  };
}

export const SEED_ASSESSMENTS: Assessment[] = [
  seedAssessment("seed-1", "C001", 7, 1, 312, 19, [0, 1], [0, 3], "Orang tua melaporkan anak sering mengulang suku kata awal sejak usia 4 tahun.", 184),
  seedAssessment("seed-2", "C002", 12, 3, 405, 41, [0, 2, 3], [0, 4, 6], "Keluhan blocking saat membaca nyaring di kelas.", 240),
  seedAssessment("seed-3", "C003", 24, 6, 520, 13, [0, 3], [1, 5], "Mahasiswa, merasa tidak lancar saat presentasi.", 302),
  seedAssessment("seed-4", "C001", 7, 14, 298, 24, [1], [0, 3, 4], "Asesmen awal sebelum program terapi.", 160),
  seedAssessment("seed-5", "C004", 5, 20, 210, 9, [0, 1], [0, 1], "Rujukan dari dokter anak, ketidaklancaran muncul 6 bulan terakhir.", 135),
];

export const SEED_USERS: ManagedUser[] = [
  { id: DEMO_USERS.admin.id, fullName: DEMO_USERS.admin.fullName, email: DEMO_USERS.admin.email, accountType: "admin", status: "active", assessmentCount: 0, createdAt: daysAgo(120) },
  { id: DEMO_USERS.therapist.id, fullName: DEMO_USERS.therapist.fullName, email: DEMO_USERS.therapist.email, accountType: "therapist", status: "active", assessmentCount: 0, createdAt: daysAgo(90) },
  { id: "u-3", fullName: "Dimas Saputra", email: "dimas@fluencycare.id", accountType: "therapist", status: "active", assessmentCount: 0, createdAt: daysAgo(60) },
  { id: "u-4", fullName: "Nabila Putri", email: "nabila.mhs@fluencycare.id", accountType: "student", status: "active", assessmentCount: 0, createdAt: daysAgo(30) },
  { id: "u-5", fullName: "Fajar Ramadhan", email: "fajar.mhs@fluencycare.id", accountType: "student", status: "inactive", assessmentCount: 0, createdAt: daysAgo(25) },
];
