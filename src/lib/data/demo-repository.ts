import { DEFAULT_MASTER_DATA } from "../constants";
import { uid } from "../format";
import { computeSS } from "../ss";
import type { Assessment, LoginLog, ManagedUser, MasterData } from "../types";
import type { Repository } from "./repository";
import { SEED_ASSESSMENTS, SEED_LOGIN_LOGS, SEED_USERS } from "./seed";

const KEYS = {
  assessments: "fc_demo_assessments",
  users: "fc_demo_users",
  master: "fc_demo_master",
  logs: "fc_demo_login_logs",
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

  async deleteAssessment(id) {
    const all = read<Assessment[]>(KEYS.assessments, SEED_ASSESSMENTS);
    write(
      KEYS.assessments,
      all.filter((a) => a.id !== id)
    );
  },

  async listUsers() {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    const assessments = await demoRepository.listAssessments();
    return users.map((u) => ({
      ...u,
      assessmentCount: assessments.filter((a) => a.therapistName === u.fullName).length,
    }));
  },

  addUser: async ({ fullName, username, email, password, accountType }) => {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    const cleanUsername = username.trim().toLowerCase();
    const finalEmail = (email?.trim() || `${cleanUsername}@flunify.id`).toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username '${cleanUsername}' sudah digunakan.`);
    }
    if (users.some((u) => u.email.toLowerCase() === finalEmail)) {
      throw new Error(`Email '${finalEmail}' sudah digunakan.`);
    }

    const user: ManagedUser = {
      id: uid(),
      fullName: fullName.trim(),
      username: cleanUsername,
      email: finalEmail,
      password: password || "Terapis@Flunify2026",
      accountType,
      status: "active",
      assessmentCount: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    write(KEYS.users, [...users, user]);
    return user;
  },

  async updateUser(id, updates) {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    const target = users.find((u) => u.id === id);
    if (!target) throw new Error("Pengguna tidak ditemukan.");

    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
        throw new Error(`Username '${cleanUsername}' sudah digunakan pengguna lain.`);
      }
    }

    const updatedUser: ManagedUser = {
      ...target,
      ...updates,
      fullName: updates.fullName !== undefined ? updates.fullName.trim() : target.fullName,
      username: updates.username !== undefined ? updates.username.trim().toLowerCase() : target.username,
      email: updates.email !== undefined ? updates.email.trim().toLowerCase() : target.email,
      password: updates.password !== undefined ? updates.password : target.password,
    };

    write(
      KEYS.users,
      users.map((u) => (u.id === id ? updatedUser : u))
    );
    return updatedUser;
  },

  async deleteUser(id) {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    write(KEYS.users, users.filter((u) => u.id !== id));
  },

  async updateUserStatus(id, status) {
    const users = read<ManagedUser[]>(KEYS.users, SEED_USERS);
    write(KEYS.users, users.map((u) => (u.id === id ? { ...u, status } : u)));
  },

  async listLoginLogs() {
    const logs = read<LoginLog[]>(KEYS.logs, SEED_LOGIN_LOGS);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  async recordLoginLog(log) {
    const logs = read<LoginLog[]>(KEYS.logs, SEED_LOGIN_LOGS);
    const newEntry: LoginLog = {
      ...log,
      id: uid(),
      timestamp: new Date().toISOString(),
    };
    write(KEYS.logs, [newEntry, ...logs].slice(0, 50)); // Simpan 50 log terakhir
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
