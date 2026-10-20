import { UsersManagement } from "./UsersManagement";

export const metadata = {
  title: "Manajemen Pengguna · FluencyCare",
  description: "Kelola akun terapis, mahasiswa, dan administrator FluencyCare.",
};

export default function UsersPage() {
  return <UsersManagement />;
}
