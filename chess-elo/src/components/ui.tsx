import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  action?: ReactNode;
}) {
  if (!title) {
    return (
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        {back ? (
          <Link href={back} className="-ml-2 inline-flex items-center text-sm font-medium text-ink-2">
            <ChevronLeft className="h-5 w-5" /> Back
          </Link>
        ) : (
          <span />
        )}
        {action}
      </header>
    );
  }

  return (
    <header className="px-5 pt-6 pb-4">
      {back && (
        <Link href={back} className="-ml-2 mb-2 inline-flex items-center text-sm font-medium text-ink-2">
          <ChevronLeft className="h-5 w-5" /> Back
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Delta({ value, className = "" }: { value: number; className?: string }) {
  const tone =
    value > 0 ? "text-accent bg-accent-soft" : value < 0 ? "text-loss bg-loss-soft" : "text-draw bg-surface-2";
  return (
    <span className={`tabular inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tone} ${className}`}>
      {value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "±0"}
    </span>
  );
}

export function Outcome({ value }: { value: "W" | "D" | "L" }) {
  const tone = value === "W" ? "bg-accent text-white" : value === "L" ? "bg-loss text-white" : "bg-surface-2 text-draw";
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${tone}`}>
      {value}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card mx-5 flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        ♞
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white active:scale-[0.98]"
    >
      {children}
    </Link>
  );
}

export function formatTimeControl(tc?: { base: number; inc: number }) {
  if (!tc) return null;
  const min = tc.base / 60;
  return `${Number.isInteger(min) ? min : min.toFixed(1)}+${tc.inc}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}
