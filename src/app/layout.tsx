import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { getServerSession } from "@/lib/auth/get-session";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flunify — find your rhythm",
    template: "%s · Flunify",
  },
  description:
    "Flunify — platform dokumentasi asesmen kelancaran bicara: observasi gagap, perekaman sampel bicara, dan perhitungan %SS otomatis untuk terapis wicara. Find your rhythm.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-screen font-sans">
        <AuthProvider initialSession={session}>{children}</AuthProvider>
      </body>
    </html>
  );
}
