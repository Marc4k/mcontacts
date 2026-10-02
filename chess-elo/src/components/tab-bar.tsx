"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, History, Trophy, Users } from "lucide-react";

const tabs = [
  { href: "/", label: "Ranking", icon: Trophy },
  { href: "/games", label: "Games", icon: History },
  { href: "/players", label: "Players", icon: Users },
  { href: "/stats", label: "Stats", icon: ChartColumn },
] as const;

export function TabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/play") || pathname.startsWith("/login")) return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5 pb-1.5">
        {tabs.slice(0, 2).map((t) => (
          <Tab key={t.href} {...t} active={isActive(t.href)} />
        ))}
        <Link
          href="/play"
          className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-lg shadow-black/20 active:scale-95"
          aria-label="New match"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </Link>
        {tabs.slice(2).map((t) => (
          <Tab key={t.href} {...t} active={isActive(t.href)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Trophy;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex w-16 flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
        active ? "text-ink" : "text-muted"
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
      {label}
    </Link>
  );
}
