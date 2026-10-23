import { UsersManagement } from "./UsersManagement";

export const metadata = {
  title: "Manajemen Pengguna · Flunify",
  description: "Kelola akun terapis, mahasiswa, dan administrator Flunify.",
};

export default function UsersPage() {
  return <UsersManagement />;
}
