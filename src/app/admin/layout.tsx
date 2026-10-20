import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getServerSession } from "@/lib/auth/get-session";

/** Lapisan proteksi kedua (selain proxy.ts) untuk seluruh halaman Mode Admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.activeRole !== "admin") redirect("/dashboard");
  return <AppShell>{children}</AppShell>;
}
