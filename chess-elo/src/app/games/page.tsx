import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { DeleteGameButton } from "@/components/delete-game-button";
import { Delta, EmptyState, formatTimeControl, PageHeader, PrimaryLink } from "@/components/ui";
import { When } from "@/components/when";
import type { Player, RatedGame } from "@/lib/elo";
import { getRatings } from "@/lib/store";

export const metadata: Metadata = { title: "Games" };

export default async function GamesPage() {
  const { standings, games } = await getRatings();
  const byId = new Map(standings.map((s) => [s.player.id, s.player]));

  return (
    <>
      <PageHeader title="Games" subtitle={games.length ? `${games.length} played` : undefined} />
      {games.length === 0 ? (
        <EmptyState
          title="No games yet"
          body="Start a match, play over the board, and the result lands here."
          action={<PrimaryLink href="/play">Start a match</PrimaryLink>}
        />
      ) : (
        <ul className="space-y-2 px-5">
          {games.map((g) => (
            <GameCard key={g.id} game={g} white={byId.get(g.whiteId)!} black={byId.get(g.blackId)!} />
          ))}
        </ul>
      )}
    </>
  );
}

function GameCard({ game: g, white, black }: { game: RatedGame; white: Player; black: Player }) {
  const label = g.result === "1-0" ? "1–0" : g.result === "0-1" ? "0–1" : "½–½";
  const tc = formatTimeControl(g.timeControl);
  return (
    <li className="card px-4 py-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          <When iso={g.playedAt} time />
          {tc && ` · ${tc}`}
          {g.endReason === "timeout" && " · on time"}
        </span>
        <DeleteGameButton id={g.id} label={`${white.name} vs ${black.name}`} />
      </div>
      <div className="flex items-center gap-2">
        <Side player={white} piece="♔" delta={g.whiteDelta} won={g.result === "1-0"} />
        <span className="tabular shrink-0 rounded-full bg-bg px-2.5 py-1 text-sm font-bold">{label}</span>
        <Side player={black} piece="♚" delta={g.blackDelta} won={g.result === "0-1"} right />
      </div>
    </li>
  );
}

function Side({
  player,
  piece,
  delta,
  won,
  right,
}: {
  player: Player;
  piece: string;
  delta: number;
  won: boolean;
  right?: boolean;
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className={`flex min-w-0 flex-1 items-center gap-2 ${right ? "flex-row-reverse text-right" : ""}`}
    >
      <Avatar player={player} size={36} />
      <div className="min-w-0">
        <div className={`truncate text-sm ${won ? "font-bold" : "font-medium"}`}>
          <span aria-hidden>{piece}</span> {player.name}
        </div>
        <Delta value={delta} />
      </div>
    </Link>
  );
}
