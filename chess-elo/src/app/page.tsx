import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Delta, EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import { INITIAL_RATING, type Standing } from "@/lib/elo";
import { getRatings } from "@/lib/store";

export default async function LeaderboardPage() {
  const { standings, games } = await getRatings();

  if (standings.length === 0) {
    return (
      <>
        <PageHeader title="Ranking" />
        <EmptyState
          title="Start your club"
          body={`Add your friends. Everyone starts at ${INITIAL_RATING} Elo, then you play to climb the ladder.`}
          action={
            <PrimaryLink href="/players/new">
              <Plus className="h-5 w-5" /> Add player
            </PrimaryLink>
          }
        />
      </>
    );
  }

  const podium = standings.slice(0, 3);
  const rest = standings.slice(3);

  return (
    <>
      <PageHeader
        title="Ranking"
        subtitle={`${standings.length} players · ${games.length} ${games.length === 1 ? "game" : "games"}`}
      />

      {podium.length === 3 ? (
        <section className="mx-5 mb-4 grid grid-cols-3 items-end gap-2">
          <Podium standing={podium[1]} place={2} />
          <Podium standing={podium[0]} place={1} />
          <Podium standing={podium[2]} place={3} />
        </section>
      ) : null}

      <ol className="card mx-5 divide-y divide-line overflow-hidden">
        {(podium.length === 3 ? rest : standings).map((s, i) => (
          <Row key={s.player.id} standing={s} rank={i + 1 + (podium.length === 3 ? 3 : 0)} />
        ))}
        {podium.length === 3 && rest.length === 0 && (
          <li className="px-4 py-4 text-center text-sm text-muted">Add more friends to grow the ladder.</li>
        )}
      </ol>
    </>
  );
}

const MEDAL = { 1: "var(--gold)", 2: "var(--silver)", 3: "var(--bronze)" } as const;

function Podium({ standing, place }: { standing: Standing; place: 1 | 2 | 3 }) {
  const first = place === 1;
  return (
    <Link
      href={`/players/${standing.player.id}`}
      className={`card flex flex-col items-center px-2 text-center active:scale-[0.98] ${first ? "pt-5 pb-5" : "pt-4 pb-4"}`}
    >
      <div className="relative">
        <Avatar player={standing.player} size={first ? 72 : 56} ring={MEDAL[place]} />
        <span
          className="absolute -bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white"
          style={{ background: MEDAL[place] }}
        >
          {place}
        </span>
      </div>
      <div className="mt-4 w-full truncate text-sm font-semibold">{standing.player.name}</div>
      <div className={`tabular font-bold tracking-tight ${first ? "text-2xl" : "text-xl"}`}>{standing.rating}</div>
      <div className="tabular text-[11px] text-muted">
        {standing.wins}W {standing.draws}D {standing.losses}L
      </div>
    </Link>
  );
}

function Row({ standing: s, rank }: { standing: Standing; rank: number }) {
  return (
    <li>
      <Link href={`/players/${s.player.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
        <span className="tabular w-6 text-center text-sm font-semibold text-muted">{rank}</span>
        <Avatar player={s.player} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{s.player.name}</div>
          <div className="tabular text-xs text-muted">
            {s.games === 0 ? "No games yet" : `${s.games} games · ${s.wins}W ${s.draws}D ${s.losses}L`}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="tabular text-lg font-bold">{s.rating}</span>
          {s.games > 0 && <Delta value={s.lastDelta} />}
        </div>
      </Link>
    </li>
  );
}
