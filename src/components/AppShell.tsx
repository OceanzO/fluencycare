"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  PlusCircle,
  Shield,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "./Logo";
import { useSession, useAuth } from "@/lib/auth/AuthContext";
import { cn, initials } from "@/lib/format";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const NAV: Record<Role, NavItem[]> = {
  therapist: [
    { href: "/dashboard", label: "Dashboard Klinis", icon: LayoutDashboard },
    { href: "/assessments/new", label: "Asesmen Baru", icon: PlusCircle },
  ],
  admin: [
    { href: "/admin", label: "Admin Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Manajemen Pengguna", icon: Users },
    { href: "/admin/master-data", label: "Master Data Klinis", icon: ListChecks },
  ],
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const isAdmin = session.activeRole === "admin";
  const items = NAV[session.activeRole];

  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex flex-col gap-6">
        <Link href={items[0].href} onClick={onNavigate} className="px-1">
          <Logo />
        </Link>

        {/* Role Identity Tag */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold",
            isAdmin
              ? "bg-navy/10 text-navy border border-navy/15"
              : "bg-brand-light text-brand border border-brand/20"
          )}
        >
          {isAdmin ? <Shield className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
          <span>{isAdmin ? "Panel Administrator" : "Portal Terapis Wicara"}</span>
        </div>

        {/* Menu Navigasi Sesuai Role (Terpisah Penuh) */}
        <nav aria-label="Navigasi utama" className="flex flex-col gap-1.5">
          <p className="mb-1 px-3 text-[11px] font-bold tracking-wider text-muted uppercase">
            {isAdmin ? "Administrasi Sistem" : "Layanan Klinis"}
          </p>
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200",
                  active
                    ? "bg-brand text-white shadow-md shadow-brand/25"
                    : "text-muted hover:bg-brand-light hover:text-navy"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] transition-transform", !active && "group-hover:scale-110")} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profil User Aktif & Tombol Logout */}
      <div className="flex flex-col gap-3 pt-4 border-t border-line">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-navy text-sm font-bold text-white shadow-sm">
            {initials(session.user.fullName)}
            <span
              className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-success"
              title="Aktif"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy">{session.user.fullName}</p>
            <p className="truncate text-xs text-muted font-medium">
              {isAdmin ? "Administrator" : session.user.title || "Terapis Wicara"}
            </p>
          </div>
          <button
            id="logout-button"
            type="button"
            onClick={async () => {
              setSigningOut(true);
              await signOut();
            }}
            disabled={signingOut}
            aria-label="Keluar dari akun"
            title="Keluar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-danger-light hover:text-danger"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const session = useSession();
  const isAdmin = session.activeRole === "admin";

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Header Mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo subtitle={false} />
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              isAdmin ? "bg-navy/10 text-navy" : "bg-brand-light text-brand"
            )}
          >
            {isAdmin ? "Admin" : "Terapis"}
          </span>
          <button
            id="mobile-menu-button"
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu navigasi"
            className="grid h-10 w-10 place-items-center rounded-xl text-navy hover:bg-brand-light"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Drawer Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button
            aria-label="Tutup menu navigasi"
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-lift animate-fade-up">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu navigasi"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-canvas"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Konten Halaman */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
