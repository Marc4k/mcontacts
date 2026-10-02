import type { Metadata } from "next";
import Link from "next/link";
import { Swords } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { ComparisonChart } from "@/components/comparison-chart";
import { H2HPicker } from "@/components/h2h-picker";
import { Delta, EmptyState, formatTimeControl, PageHeader } from "@/components/ui";
import { When } from "@/components/when";
import type { Player, RatedGame, Standing } from "@/lib/elo";
import { getRatings } from "@/lib/store";
import { matchup, type Record3 } from "@/lib/stats";

export const metadata: Metadata = { title: "Head to head" };

// Categorical slots 1 and 2 (blue, orange), checked for color-blind separation.
const A = "#2a78d6";
const B = "#eb6834";

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function HeadToHeadPage({ searchParams }: PageProps<"/h2h">) {
  const q = await searchParams;
  const { standings, games } = await getRatings();
  const byId = new Map(standings.map((s) => [s.player.id, s]));
  const pickable = [...standings]
    .sort((x, y) => x.player.name.localeCompare(y.player.name))
    .map((s) => ({ id: s.player.id, name: s.player.name, photoVersion: s.player.photoVersion, rating: s.rating }));

  const aId = byId.has(param(q.a) ?? "") ? param(q.a) : undefined;
  const bId = byId.has(param(q.b) ?? "") && param(q.b) !== aId ? param(q.b) : undefined;
  const sa = aId ? byId.get(aId) : undefined;
  const sb = bId ? byId.get(bId) : undefined;

  return (
    <>
      <PageHeader title="Head to head" back="/stats" />
      {standings.length < 2 ? (
        <EmptyState title="Not enough players" body="Add at least two players to compare them." />
      ) : (
        <>
          <H2HPicker players={pickable} a={aId} b={bId} colors={[A, B]} />
          {sa && sb ? (
            <Comparison a={sa} b={sb} games={games} byId={byId} />
          ) : (
            <p className="mx-5 mt-6 text-center text-sm text-muted">Pick two players to compare them.</p>
          )}
        </>
      )}
    </>
  );
}

function Comparison({
  a,
  b,
  games,
  byId,
}: {
  a: Standing;
  b: Standing;
  games: RatedGame[];
  byId: Map<string, Standing>;
}) {
  const m = matchup(a.player.id, b.player.id, games);
  const n = m.games.length;
  const playHref = `/play?white=${a.player.id}&black=${b.player.id}`;

  const streakText = !m.streak
    ? null
    : m.streak.holder === "draw"
      ? `${m.streak.count} ${m.streak.count === 1 ? "draw" : "draws"} in a row`
      : `${(m.streak.holder === "a" ? a : b).player.name} won the last ${m.streak.count === 1 ? "game" : `${m.streak.count}`}`;

  return (
    <>
      {n === 0 ? (
        <div className="card mx-5 mt-4 px-5 py-6 text-center">
          <p className="font-semibold">They haven&apos;t played each other yet</p>
          <p className="mt-1 text-sm text-muted">Time to settle it over the board.</p>
        </div>
      ) : (
        <section className="card mx-5 mt-4 p-4">
          <div className="flex items-end justify-between">
            <Score value={m.a.wins} label={`${a.player.name} wins`} color={A} />
            <Score value={m.a.draws} label="Draws" />
            <Score value={m.b.wins} label={`${b.player.name} wins`} color={B} right />
          </div>
          <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
            {m.a.wins > 0 && <div style={{ flexGrow: m.a.wins, background: A }} />}
            {m.a.draws > 0 && <div style={{ flexGrow: m.a.draws, background: "var(--silver)" }} />}
            {m.b.wins > 0 && <div style={{ flexGrow: m.b.wins, background: B }} />}
          </div>
          <p className="tabular mt-3 text-center text-sm text-ink-2">
            {n} {n === 1 ? "game" : "games"} · score{" "}
            <span className="font-semibold text-ink">
              {fmtPoints(m.a.points)}–{fmtPoints(m.b.points)}
            </span>
            {streakText && <> · {streakText}</>}
          </p>
        </section>
      )}

      <Link
        href={playHref}
        className="mx-5 mt-3 flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white active:scale-[0.99]"
      >
        <Swords className="h-4 w-4" /> Play a match
      </Link>

      <section className="card mx-5 mt-4 px-4 pt-4 pb-3">
        <h2 className="mb-2 text-sm font-semibold">Rating over time</h2>
        <ComparisonChart
          series={[
            { name: a.player.name, color: A, points: a.history },
            { name: b.player.name, color: B, points: b.history },
          ]}
          marks={m.games.map((g) => g.playedAt)}
        />
      </section>

      <section className="card mx-5 mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted">
              <th className="w-1/3 py-3 pl-4 text-left font-medium">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: A }} />
                {a.player.name}
              </th>
              <th className="w-1/3 py-3 font-medium" />
              <th className="w-1/3 py-3 pr-4 text-right font-medium">
                {b.player.name}
                <span className="ml-1.5 inline-block h-2 w-2 rounded-full" style={{ background: B }} />
              </th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            <Compare label="Rating" a={a.rating} b={b.rating} higherIsBetter />
            <Compare label="Peak" a={a.peak} b={b.peak} higherIsBetter />
            <Compare label="Rank" a={rank(a, byId)} b={rank(b, byId)} format={(v) => `#${v}`} lowerIsBetter />
            <Compare label="Games" a={a.games} b={b.games} />
            <Compare label="Overall score" a={pct(a)} b={pct(b)} format={(v) => (v < 0 ? "–" : `${v}%`)} higherIsBetter />
            {n > 0 && (
              <>
                <Compare label="Elo won from rival" a={m.a.eloNet} b={m.b.eloNet} format={signed} higherIsBetter />
                <tr>
                  <td className="py-2.5 pl-4">{record(m.a.asWhite)}</td>
                  <td className="py-2.5 text-center text-xs text-muted">As white here</td>
                  <td className="py-2.5 pr-4 text-right">{record(m.b.asWhite)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      {(m.a.biggestWin || m.b.biggestWin) && (
        <section className="card mx-5 mt-4 divide-y divide-line">
          {m.a.biggestWin && <BestWin player={a.player} game={m.a.biggestWin} />}
          {m.b.biggestWin && <BestWin player={b.player} game={m.b.biggestWin} />}
        </section>
      )}

      {n > 0 && (
        <section className="card mx-5 mt-4 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">Their games</h2>
          <ul className="divide-y divide-line">
            {m.games.map((g) => {
              const white = byId.get(g.whiteId)!.player;
              const black = byId.get(g.blackId)!.player;
              const winner = g.result === "1-0" ? white : g.result === "0-1" ? black : null;
              const tc = formatTimeControl(g.timeControl);
              const aDelta = g.whiteId === a.player.id ? g.whiteDelta : g.blackDelta;
              return (
                <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-8 w-1 shrink-0 rounded-full"
                    style={{ background: !winner ? "var(--silver)" : winner.id === a.player.id ? A : B }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{winner ? `${winner.name} won` : "Draw"}</div>
                    <div className="truncate text-xs text-muted">
                      ♔ {white.name} vs ♚ {black.name} · <When iso={g.playedAt} />
                      {tc && ` · ${tc}`}
                      {g.endReason === "timeout" && " · on time"}
                    </div>
                  </div>
                  <Delta value={aDelta} />
                </li>
              );
            })}
          </ul>
          <p className="px-4 pb-3 text-[11px] text-muted">Rating change shown for {a.player.name}.</p>
        </section>
      )}
    </>
  );
}

const fmtPoints = (p: number) => (Number.isInteger(p) ? String(p) : `${Math.floor(p) || ""}½`);
const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : "±0");
const record = (r: Record3) => `${r.wins}W ${r.draws}D ${r.losses}L`;
const pct = (s: Standing) => (s.games ? Math.round(((s.wins + s.draws / 2) / s.games) * 100) : -1);
// byId was built from standings, which are sorted by rating.
const rank = (s: Standing, byId: Map<string, Standing>) => [...byId.keys()].indexOf(s.player.id) + 1;

function Score({ value, label, color, right }: { value: number; label: string; color?: string; right?: boolean }) {
  return (
    <div className={`min-w-0 ${right ? "text-right" : color ? "" : "text-center"}`}>
      <div className="tabular text-4xl font-bold tracking-tight">{value}</div>
      <div className={`mt-0.5 flex items-center gap-1.5 text-xs text-muted ${right ? "justify-end" : color ? "" : "justify-center"}`}>
        {color && !right && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
        <span className="truncate">{label}</span>
        {color && right && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
      </div>
    </div>
  );
}

function Compare({
  label,
  a,
  b,
  format = String,
  higherIsBetter,
  lowerIsBetter,
}: {
  label: string;
  a: number;
  b: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
  lowerIsBetter?: boolean;
}) {
  const aWins = (higherIsBetter && a > b) || (lowerIsBetter && a < b);
  const bWins = (higherIsBetter && b > a) || (lowerIsBetter && b < a);
  return (
    <tr>
      <td className={`py-2.5 pl-4 ${aWins ? "font-bold" : "text-ink-2"}`}>{format(a)}</td>
      <td className="py-2.5 text-center text-xs text-muted">{label}</td>
      <td className={`py-2.5 pr-4 text-right ${bWins ? "font-bold" : "text-ink-2"}`}>{format(b)}</td>
    </tr>
  );
}

function BestWin({ player, game }: { player: Player; game: RatedGame }) {
  const delta = game.whiteId === player.id ? game.whiteDelta : game.blackDelta;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar player={player} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-muted">{player.name}&apos;s biggest win</div>
        <div className="text-sm font-semibold">
          <When iso={game.playedAt} />
          {game.endReason === "timeout" && <span className="font-normal text-muted"> · on time</span>}
        </div>
      </div>
      <Delta value={delta} />
    </div>
  );
}
