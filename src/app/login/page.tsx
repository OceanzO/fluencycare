import type { Metadata } from "next";
import { LoginView } from "./LoginView";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke portal Flunify untuk dokumentasi asesmen kelancaran bicara.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginView next={next ?? null} />;
}
