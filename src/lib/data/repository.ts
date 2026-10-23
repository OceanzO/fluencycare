import type {
  AccountStatus,
  AccountType,
  AppUser,
  Assessment,
  LoginLog,
  ManagedUser,
  MasterData,
  NewAssessmentInput,
  StorageUsage,
} from "../types";

/** Kontrak data yang sama untuk Mode Demo dan Supabase, sehingga UI tidak perlu tahu sumbernya. */
export interface Repository {
  listAssessments(): Promise<Assessment[]>;
  createAssessment(input: NewAssessmentInput, user: AppUser): Promise<Assessment>;
  listUsers(): Promise<ManagedUser[]>;
  addUser: ((input: {
    fullName: string;
    username: string;
    email?: string;
    password?: string;
    accountType: AccountType;
  }) => Promise<ManagedUser>) | null;
  updateUser?: (
    id: string,
    updates: Partial<{
      fullName: string;
      username: string;
      email: string;
      password?: string;
      accountType: AccountType;
      status: AccountStatus;
    }>
  ) => Promise<ManagedUser>;
  deleteUser?: (id: string) => Promise<void>;
  deleteAssessment?: (id: string) => Promise<void>;
  updateUserStatus(id: string, status: AccountStatus): Promise<void>;
  listLoginLogs?: () => Promise<LoginLog[]>;
  recordLoginLog?: (log: Omit<LoginLog, "id" | "timestamp">) => Promise<void>;
  getMasterData(): Promise<MasterData>;
  saveMasterData(data: MasterData): Promise<void>;
  getStorageUsage(): Promise<StorageUsage>;
}
