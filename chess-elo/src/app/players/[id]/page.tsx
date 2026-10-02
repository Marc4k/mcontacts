import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Swords } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { RatingChart } from "@/components/rating-chart";
import { Delta, Outcome, PageHeader } from "@/components/ui";
import { When } from "@/components/when";
import { getRatings } from "@/lib/store";
import { playerStats, type Record3 } from "@/lib/stats";

export async function generateMetadata({ params }: PageProps<"/players/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { standings } = await getRatings();
  return { title: standings.find((s) => s.player.id === id)?.player.name ?? "Player" };
}

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;
  const { standings, games } = await getRatings();
  const s = standings.find((st) => st.player.id === id);
  if (!s) notFound();

  const stats = playerStats(id, standings, games);
  const byId = new Map(standings.map((st) => [st.player.id, st.player]));

  return (
    <>
      <PageHeader
        title=""
        back="/players"
        action={
          <Link
            href={`/players/${id}/edit`}
            className="flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold shadow-sm active:scale-95"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        }
      />

      <section className="mx-5 -mt-2 flex flex-col items-center text-center">
        <Avatar player={s.player} size={104} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{s.player.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="tabular text-4xl font-bold tracking-tight">{s.rating}</span>
          <span className="text-sm text-muted">Elo</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Rank #{stats.rank} of {standings.length}
          {s.games > 0 && (
            <>
              {" "}
              · last game <Delta value={s.lastDelta} />
            </>
          )}
        </p>
      </section>

      <section className="mx-5 mt-5 grid grid-cols-3 gap-2">
        <Tile label="Games" value={s.games} />
        <Tile label="Score" value={stats.scorePct === null ? "–" : `${stats.scorePct}%`} />
        <Tile label="Peak" value={s.peak} />
      </section>

      {s.games === 0 ? (
        <div className="card mx-5 mt-4 px-5 py-8 text-center">
          <p className="font-semibold">No games yet</p>
          <p className="mt-1 text-sm text-muted">Stats and the rating chart show up after the first game.</p>
          <Link
            href="/play"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white"
          >
            <Swords className="h-4 w-4" /> Start a match
          </Link>
        </div>
      ) : (
        <>
          <section className="card mx-5 mt-4 px-4 pt-4 pb-3">
            <h2 className="mb-2 text-sm font-semibold">Rating</h2>
            <RatingChart history={s.history} />
          </section>

          <section className="card mx-5 mt-4 p-4">
            <h2 className="mb-3 text-sm font-semibold">Results</h2>
            <ResultBar record={s} />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ColorRecord label="As white" piece="♔" record={stats.asWhite} />
              <ColorRecord label="As black" piece="♚" record={stats.asBlack} />
            </div>
          </section>

          <section className="mx-5 mt-4 grid grid-cols-2 gap-2">
            <Tile
              label="Current streak"
              value={stats.currentStreak ? `${stats.currentStreak.count}${stats.currentStreak.kind}` : "–"}
            />
            <Tile label="Best win streak" value={stats.bestWinStreak} />
            <Tile label="Lowest" value={stats.lowest} />
            <Tile label="Lost on time" value={stats.timeouts.lost} />
          </section>

          {(stats.bestWin || stats.biggestGain) && (
            <section className="card mx-5 mt-4 divide-y divide-line">
              {stats.bestWin && (
                <Highlight
                  label="Best win"
                  opponent={byId.get(stats.bestWin.opponentId)!}
                  detail={`beat ${stats.bestWin.opponentBefore}`}
                  delta={stats.bestWin.delta}
                />
              )}
              {stats.biggestGain && (
                <Highlight
                  label="Biggest gain"
                  opponent={byId.get(stats.biggestGain.opponentId)!}
                  detail={stats.biggestGain.outcome === "W" ? "win" : "draw"}
                  delta={stats.biggestGain.delta}
                />
              )}
            </section>
          )}

          <section className="card mx-5 mt-4 overflow-hidden">
            <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">Head to head</h2>
            <ul className="divide-y divide-line">
              {stats.headToHead.map((h) => {
                const opp = byId.get(h.opponentId)!;
                return (
                  <li key={h.opponentId}>
                    <Link href={`/players/${opp.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
                      <Avatar player={opp} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{opp.name}</div>
                        <div className="tabular text-xs text-muted">
                          {h.wins}W {h.draws}D {h.losses}L · {h.games} {h.games === 1 ? "game" : "games"}
                        </div>
                      </div>
                      <Delta value={h.eloNet} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card mx-5 mt-4 overflow-hidden">
            <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">Recent games</h2>
            <ul className="divide-y divide-line">
              {stats.games.slice(0, 15).map((g) => {
                const opp = byId.get(g.opponentId)!;
                return (
                  <li key={g.game.id} className="flex items-center gap-3 px-4 py-3">
                    <Outcome value={g.outcome} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        <span aria-label={g.color === "white" ? "Played white" : "Played black"}>
                          {g.color === "white" ? "♔" : "♚"}
                        </span>{" "}
                        vs {opp.name} <span className="tabular text-muted">({g.opponentBefore})</span>
                      </div>
                      <div className="text-xs text-muted">
                        <When iso={g.game.playedAt} />
                        {g.game.endReason === "timeout" && " · on time"}
                      </div>
                    </div>
                    <Delta value={g.delta} />
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card px-3 py-3">
      <div className="text-[11px] font-medium text-muted">{label}</div>
      <div className="tabular mt-0.5 text-xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ResultBar({ record }: { record: Record3 }) {
  const total = record.wins + record.draws + record.losses;
  const parts = [
    { key: "Wins", one: "win", many: "wins", n: record.wins, color: "var(--accent)" },
    { key: "Draws", one: "draw", many: "draws", n: record.draws, color: "var(--silver)" },
    { key: "Losses", one: "loss", many: "losses", n: record.losses, color: "var(--loss)" },
  ];
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {parts.map(
          (p) =>
            p.n > 0 && (
              <div key={p.key} style={{ flexGrow: p.n, background: p.color }} title={`${p.key}: ${p.n}`} />
            ),
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs">
        {parts.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5 text-ink-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="tabular font-semibold text-ink">{p.n}</span> {p.n === 1 ? p.one : p.many}
            <span className="tabular text-muted">({Math.round((p.n / total) * 100)}%)</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ColorRecord({ label, piece, record }: { label: string; piece: string; record: Record3 }) {
  const n = record.wins + record.draws + record.losses;
  const pct = n ? Math.round(((record.wins + record.draws / 2) / n) * 100) : null;
  return (
    <div className="rounded-2xl bg-bg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className="text-base text-ink" aria-hidden>
          {piece}
        </span>
        {label}
      </div>
      <div className="tabular mt-1 text-lg font-bold">{pct === null ? "–" : `${pct}%`}</div>
      <div className="tabular text-xs text-muted">
        {record.wins}W {record.draws}D {record.losses}L
      </div>
    </div>
  );
}

function Highlight({
  label,
  opponent,
  detail,
  delta,
}: {
  label: string;
  opponent: { id: string; name: string; photoVersion?: number };
  detail: string;
  delta: number;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar player={opponent} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-muted">{label}</div>
        <div className="truncate text-sm font-semibold">
          vs {opponent.name} <span className="font-normal text-muted">· {detail}</span>
        </div>
      </div>
      <Delta value={delta} />
    </div>
  );
}
