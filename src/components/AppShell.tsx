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
  Stethoscope,
  UserCog,
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
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assessments/new", label: "Asesmen Baru", icon: PlusCircle },
  ],
  admin: [
    { href: "/admin", label: "Admin Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Manajemen Pengguna", icon: Users },
    { href: "/admin/master-data", label: "Master Data", icon: ListChecks },
  ],
};

function RoleSwitcher() {
  const { switchRole, canSwitchRole } = useAuth();
  const { activeRole } = useSession();
  const [pending, setPending] = useState<Role | null>(null);
  if (!canSwitchRole) return null;

  const options: { value: Role; label: string; icon: LucideIcon }[] = [
    { value: "therapist", label: "Terapis", icon: Stethoscope },
    { value: "admin", label: "Admin", icon: UserCog },
  ];

  return (
    <div>
      <p className="mb-2 px-1 text-[11px] font-bold tracking-wider text-muted uppercase">Tampilan</p>
      <div role="radiogroup" aria-label="Beralih mode" className="grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1 ring-1 ring-line">
        {options.map(({ value, label, icon: Icon }) => {
          const active = activeRole === value;
          return (
            <button
              key={value}
              id={`switch-role-${value}`}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={active || pending !== null}
              onClick={() => {
                setPending(value);
                switchRole(value);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
                active ? "bg-white text-brand shadow-sm" : "text-muted hover:text-navy",
              )}
            >
              {pending === value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const session = useSession();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV[session.activeRole];

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href={items[0].href} onClick={onNavigate} className="px-1">
        <Logo />
      </Link>

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
        <p className="mb-1 px-3 text-[11px] font-bold tracking-wider text-muted uppercase">
          {session.activeRole === "admin" ? "Administrasi" : "Klinis"}
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                active ? "bg-brand text-white shadow-md shadow-brand/25" : "text-muted hover:bg-brand-light hover:text-navy",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px] transition-transform", !active && "group-hover:scale-110")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <RoleSwitcher />

        {session.mode === "demo" && (
          <p className="rounded-xl bg-warning-light px-3 py-2 text-[11px] leading-snug font-medium text-warning">
            Mode Demo — data tersimpan di peramban ini saja.
          </p>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-navy text-sm font-bold text-white">
            {initials(session.user.fullName)}
            <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-success" title="Aktif" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy">{session.user.fullName}</p>
            <p className="truncate text-xs text-muted">{session.activeRole === "admin" ? "Administrator" : session.user.title}</p>
          </div>
          <button
            id="logout-button"
            type="button"
            onClick={async () => {
              setSigningOut(true);
              await signOut();
            }}
            disabled={signingOut}
            aria-label="Keluar"
            title="Keluar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-danger-light hover:text-danger"
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

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo subtitle={false} />
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand">
            {session.activeRole === "admin" ? "Admin" : "Terapis"}
          </span>
          <button
            id="mobile-menu-button"
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
            className="grid h-10 w-10 place-items-center rounded-xl text-navy hover:bg-brand-light"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-lift animate-fade-up">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-canvas"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
