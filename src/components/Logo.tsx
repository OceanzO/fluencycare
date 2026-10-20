import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("h-10 w-10", className)}>
      <rect width="64" height="64" rx="16" fill="#4267B2" />
      <path
        d="M14 34c4 0 4-10 8-10s4 18 8 18 4-24 8-24 4 16 8 16 4-6 4-6"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ subtitle = true, inverted = false }: { subtitle?: boolean; inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="leading-tight">
        <p className={cn("text-lg font-extrabold tracking-tight", inverted ? "text-white" : "text-navy")}>
          Fluency<span className={inverted ? "text-brand-light" : "text-brand"}>Care</span>
        </p>
        {subtitle && (
          <p className={cn("text-xs font-medium", inverted ? "text-white/70" : "text-muted")}>Asesmen Kelancaran Bicara</p>
        )}
      </div>
    </div>
  );
}
