"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Check, Plus } from "lucide-react";
import { Avatar } from "./avatar";
import { Sheet } from "./play/sheet";

type P = { id: string; name: string; photoVersion?: number; rating: number };

export function H2HPicker({
  players,
  a,
  b,
  colors,
}: {
  players: P[];
  a?: string;
  b?: string;
  colors: [string, string];
}) {
  const router = useRouter();
  const [picking, setPicking] = useState<"a" | "b" | null>(null);

  function go(nextA?: string, nextB?: string) {
    const q = new URLSearchParams();
    if (nextA) q.set("a", nextA);
    if (nextB) q.set("b", nextB);
    router.replace(`/h2h${q.size ? `?${q}` : ""}`, { scroll: false });
  }

  function pick(id: string) {
    if (picking === "a") go(id, id === b ? a : b);
    else go(id === a ? b : a, id);
    setPicking(null);
  }

  const pa = players.find((p) => p.id === a);
  const pb = players.find((p) => p.id === b);

  return (
    <div className="mx-5 flex items-center gap-2">
      <Slot player={pa} color={colors[0]} onClick={() => setPicking("a")} />
      <button
        type="button"
        aria-label="Swap sides"
        onClick={() => go(b, a)}
        disabled={!pa && !pb}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-line active:scale-90 disabled:opacity-40"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </button>
      <Slot player={pb} color={colors[1]} onClick={() => setPicking("b")} />

      {picking && (
        <Sheet title="Choose a player" onClose={() => setPicking(null)}>
          <ul className="divide-y divide-line">
            {players.map((p) => {
              const selected = p.id === (picking === "a" ? a : b);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-60"
                  >
                    <Avatar player={p} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.name}</div>
                      <div className="tabular text-xs text-muted">{p.rating} Elo</div>
                    </div>
                    {selected && <Check className="h-5 w-5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function Slot({ player, color, onClick }: { player?: P; color: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex min-w-0 flex-1 flex-col items-center px-2 pt-4 pb-3 active:scale-[0.98]"
    >
      {player ? (
        <Avatar player={player} size={64} ring={color} />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line">
          <Plus className="h-6 w-6 text-muted" />
        </span>
      )}
      <span className="mt-2.5 w-full truncate text-center text-sm font-semibold">{player?.name ?? "Choose"}</span>
      {player && <span className="tabular text-xs text-muted">{player.rating}</span>}
    </button>
  );
}
