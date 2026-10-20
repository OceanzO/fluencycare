import type { AccountStatus, AccountType, AppUser, Assessment, ManagedUser, MasterData, NewAssessmentInput, StorageUsage } from "../types";

/** Kontrak data yang sama untuk Mode Demo dan Supabase, sehingga UI tidak perlu tahu sumbernya. */
export interface Repository {
  listAssessments(): Promise<Assessment[]>;
  createAssessment(input: NewAssessmentInput, user: AppUser): Promise<Assessment>;
  listUsers(): Promise<ManagedUser[]>;
  /** null bila tidak didukung (Supabase: undangan akun lewat Supabase Dashboard / service role). */
  addUser: ((input: { fullName: string; email: string; accountType: AccountType }) => Promise<ManagedUser>) | null;
  updateUserStatus(id: string, status: AccountStatus): Promise<void>;
  getMasterData(): Promise<MasterData>;
  saveMasterData(data: MasterData): Promise<void>;
  getStorageUsage(): Promise<StorageUsage>;
}
