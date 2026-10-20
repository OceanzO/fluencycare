import { redirect } from "next/navigation";
import { homeFor } from "@/lib/constants";
import { getServerSession } from "@/lib/auth/get-session";

/** Root: belum login → /login, sudah login → dashboard sesuai peran (cadangan bila proxy dilewati). */
export default async function RootPage() {
  const session = await getServerSession();
  redirect(session ? homeFor(session.activeRole) : "/login");
}
