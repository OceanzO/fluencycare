import { DEFAULT_MASTER_DATA } from "../constants";
import { uid } from "../format";
import { computeSS } from "../ss";
import type { Assessment, ManagedUser, MasterData } from "../types";
import type { Repository } from "./repository";
import { SEED_ASSESSMENTS, SEED_USERS } from "./seed";

const KEYS = {
  assessments: "fc_demo_assessments",
  users: "fc_demo_users",
  master: "fc_demo_master",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Mode Demo: data tersimpan di localStorage peramban. Audio hanya disimpan metadatanya. */
export const demoRepository: Repository = {
  async listAssessments() {
    return read<Assessment[]>(KEYS.assessments, SEED_ASSESSMENTS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createAssessment(input, user) {
    const all = read<Assessment[]>(KEYS.assessments, SEED_ASSESSMENTS);
    const assessment: Assessment = {
      id: uid(),
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
      audio: input.audioBlob
        ? { durationSeconds: input.audioDurationSeconds, sizeBytes: input.audioBlob.size, fileReference: null }
        : null,
      therapistName: user.fullName,
      createdAt: new Date().toISOString(),
    };
    write(KEYS.assessments, [assessment, ...all]);
    return assessment;
  },

  async listUsers() {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    const assessments = await demoRepository.listAssessments();
    return users.map((u) => ({
      ...u,
      assessmentCount: assessments.filter((a) => a.therapistName === u.fullName).length,
    }));
  },

  addUser: async ({ fullName, email, accountType }) => {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email sudah terdaftar.");
    }
    const user: ManagedUser = {
      id: uid(),
      fullName,
      email,
      accountType,
      status: "active",
      assessmentCount: 0,
      createdAt: new Date().toISOString(),
    };
    write(KEYS.users, [...users, user]);
    return user;
  },

  async updateUserStatus(id, status) {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    write(KEYS.users, users.map((u) => (u.id === id ? { ...u, status } : u)));
  },

  async getMasterData() {
    return read<MasterData>(KEYS.master, DEFAULT_MASTER_DATA);
  },

  async saveMasterData(data) {
    write(KEYS.master, data);
  },

  async getStorageUsage() {
    const assessments = await demoRepository.listAssessments();
    const withAudio = assessments.filter((a) => a.audio);
    return {
      files: withAudio.length,
      bytes: withAudio.reduce((sum, a) => sum + (a.audio?.sizeBytes ?? 0), 0),
    };
  },
};
