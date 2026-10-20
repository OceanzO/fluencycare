import type { Metadata } from "next";
import { TherapistDashboard } from "./TherapistDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ringkasan asesmen kelancaran bicara: total asesmen, rata-rata %SS, dan riwayat terbaru.",
};

export default function DashboardPage() {
  return <TherapistDashboard />;
}
