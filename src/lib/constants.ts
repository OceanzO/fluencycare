import type { AppUser, MasterData, Role } from "./types";

export const DEMO_COOKIE = "fc_demo_session";
export const ROLE_COOKIE = "fc_active_role";
export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: Record<Role, AppUser> = {
  therapist: {
    id: "demo-therapist",
    email: "terapis@fluencycare.id",
    fullName: "Amanda Pratiwi",
    title: "Terapis Wicara",
    role: "therapist",
  },
  admin: {
    id: "demo-admin",
    email: "admin@fluencycare.id",
    fullName: "Rizky Hidayat",
    title: "Administrator Klinik",
    role: "admin",
  },
};

export const DEFAULT_MASTER_DATA: MasterData = {
  speechTasks: ["Bicara spontan", "Bercerita", "Menjawab pertanyaan", "Membaca"],
  disfluencyTypes: [
    "Pengulangan bunyi/suku kata",
    "Pengulangan kata utuh",
    "Pengulangan frasa",
    "Pemanjangan bunyi (prolongation)",
    "Blocking",
    "Interjeksi / jeda",
    "Perilaku penyerta",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  therapist: "Mode Terapis",
  admin: "Mode Admin",
};

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
