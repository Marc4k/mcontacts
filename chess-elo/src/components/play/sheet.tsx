"use client";

import type { ReactNode } from "react";

export function Sheet({ children, onClose, title }: { children: ReactNode; onClose?: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-sheet pb-safe relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-surface">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
        <h2 className="px-5 pt-3 pb-2 text-lg font-bold">{title}</h2>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
