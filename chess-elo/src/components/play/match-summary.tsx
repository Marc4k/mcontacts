"use client";

import Link from "next/link";
import { Crown, Repeat } from "lucide-react";
import { Avatar } from "../avatar";
import { Delta } from "../ui";
import type { Finished, PlayPlayer } from "./types";

export function MatchSummary({
  finished,
  white,
  black,
  onRematch,
  onNew,
}: {
  finished: Finished;
  white: PlayPlayer;
  black: PlayPlayer;
  onRematch: () => void;
  onNew: () => void;
}) {
  const { game } = finished;
  const draw = game.result === "1/2-1/2";
  const winner = game.result === "1-0" ? white : game.result === "0-1" ? black : null;
  const moves = finished.match.clock ? Math.max(finished.match.clock.moves.w, finished.match.clock.moves.b) : 0;

  return (
    <div className="px-5 pt-10">
      <div className="flex flex-col items-center text-center">
        {winner ? (
          <div className="animate-pop relative">
            <Crown className="absolute -top-7 left-1/2 h-8 w-8 -translate-x-1/2 text-gold" fill="currentColor" />
            <Avatar player={winner} size={112} ring="var(--gold)" />
          </div>
        ) : (
          <div className="animate-pop flex -space-x-6">
            <Avatar player={white} size={96} className="ring-4 ring-bg" />
            <Avatar player={black} size={96} className="ring-4 ring-bg" />
          </div>
        )}
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{winner ? `${winner.name} wins!` : "It's a draw"}</h1>
        <p className="mt-1 text-sm text-muted">
          {draw ? "½–½" : game.result.replace("-", "–")}
          {game.endReason === "timeout" && " · on time"}
          {moves > 0 && ` · ${moves} ${moves === 1 ? "move" : "moves"}`}
        </p>
      </div>

      <div className="card mt-8 divide-y divide-line">
        <Row player={white} piece="♔ White" before={game.whiteBefore} delta={game.whiteDelta} />
        <Row player={black} piece="♚ Black" before={game.blackBefore} delta={game.blackDelta} />
      </div>

      <button
        type="button"
        onClick={onRematch}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-[17px] font-semibold text-white active:scale-[0.99]"
      >
        <Repeat className="h-5 w-5" /> Rematch, colors swapped
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onNew}
          className="h-12 rounded-full bg-surface text-[15px] font-semibold shadow-sm ring-1 ring-line active:scale-[0.99]"
        >
          New match
        </button>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-full bg-surface text-[15px] font-semibold shadow-sm ring-1 ring-line active:scale-[0.99]"
        >
          Ranking
        </Link>
      </div>
    </div>
  );
}

function Row({ player, piece, before, delta }: { player: PlayPlayer; piece: string; before: number; delta: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <Avatar player={player} size={48} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{player.name}</div>
        <div className="text-xs text-muted">{piece}</div>
      </div>
      <div className="text-right">
        <div className="tabular flex items-center justify-end gap-1.5 text-sm text-muted">
          {before} <span aria-hidden>→</span>
          <span className="text-xl font-bold text-ink">{before + delta}</span>
        </div>
        <Delta value={delta} className="mt-0.5 text-sm" />
      </div>
    </div>
  );
}
