"use client";

import { useState } from "react";
import { previewDeltas, type Result } from "@/lib/elo";
import { Avatar } from "../avatar";
import { Sheet } from "./sheet";
import type { PlayPlayer, Side } from "./types";

export function FinishSheet({
  white,
  black,
  flagged,
  saving,
  error,
  onSave,
  onCancel,
}: {
  white: PlayPlayer;
  black: PlayPlayer;
  flagged: Side | null;
  saving: boolean;
  error?: string;
  onSave: (result: Result) => void;
  onCancel?: () => void;
}) {
  const [result, setResult] = useState<Result | null>(flagged === "w" ? "0-1" : flagged === "b" ? "1-0" : null);
  const preview = previewDeltas(white, black);
  const loser = flagged === "w" ? white : flagged === "b" ? black : null;

  return (
    <Sheet title="Who won?" onClose={saving ? undefined : onCancel}>
      {loser && (
        <p className="-mt-1 mb-3 rounded-2xl bg-loss-soft px-4 py-2.5 text-sm font-medium text-loss">
          {loser.name} ran out of time.
        </p>
      )}
      <div className="space-y-2">
        <Option
          selected={result === "1-0"}
          onClick={() => setResult("1-0")}
          title={`${white.name} wins`}
          caption="♔ White"
          avatars={[white]}
          deltas={[preview["1-0"].white, preview["1-0"].black]}
        />
        <Option
          selected={result === "1/2-1/2"}
          onClick={() => setResult("1/2-1/2")}
          title="Draw"
          caption="½–½"
          avatars={[white, black]}
          deltas={[preview["1/2-1/2"].white, preview["1/2-1/2"].black]}
        />
        <Option
          selected={result === "0-1"}
          onClick={() => setResult("0-1")}
          title={`${black.name} wins`}
          caption="♚ Black"
          avatars={[black]}
          deltas={[preview["0-1"].white, preview["0-1"].black]}
        />
      </div>
      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
      <button
        type="button"
        disabled={!result || saving}
        onClick={() => result && onSave(result)}
        className="mt-4 h-14 w-full rounded-full bg-ink text-[17px] font-semibold text-white active:scale-[0.99] disabled:opacity-30"
      >
        {saving ? "Saving…" : "Save result"}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="mt-1 h-12 w-full rounded-full text-[15px] font-semibold text-ink-2 active:bg-surface-2"
        >
          {flagged ? "Back" : "Back to game"}
        </button>
      )}
      <p className="sr-only">
        Rating change for {white.name} and {black.name} is shown next to each option.
      </p>
    </Sheet>
  );
}

function Option({
  selected,
  onClick,
  title,
  caption,
  avatars,
  deltas,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  caption: string;
  avatars: PlayPlayer[];
  deltas: [number, number];
}) {
  const fmt = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-3xl border-2 p-3 text-left active:scale-[0.99] ${
        selected ? "border-ink bg-bg" : "border-line"
      }`}
    >
      <div className="flex -space-x-4">
        {avatars.map((p) => (
          <Avatar key={p.id} player={p} size={44} className="ring-2 ring-white" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{title}</div>
        <div className="text-xs text-muted">{caption}</div>
      </div>
      <div className="tabular text-right text-xs text-muted">
        <div>♔ {fmt(deltas[0])}</div>
        <div>♚ {fmt(deltas[1])}</div>
      </div>
    </button>
  );
}
