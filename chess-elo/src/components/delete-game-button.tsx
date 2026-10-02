"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteGame } from "@/app/actions";

export function DeleteGameButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`Delete ${label}`}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete ${label}? Ratings are recalculated for everyone.`)) return;
        start(async () => {
          const res = await deleteGame(id);
          if (res.error) alert(res.error);
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-40"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
