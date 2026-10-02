import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Swords } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { EmptyState, PageHeader, PrimaryLink } from "@/components/ui";
import type { Player } from "@/lib/elo";
import { getRatings } from "@/lib/store";
import { playerStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Stats" };

export default async function StatsPage() {
  const { standings, games } = await getRatings();
  const byId = new Map(standings.map((s) => [s.player.id, s.player]));

  if (games.length === 0) {
    return (
      <>
        <PageHeader title="Stats" />
        <EmptyState
          title="Nothing to count yet"
          body="Club stats appear after your first game."
          action={<PrimaryLink href="/play">Start a match</PrimaryLink>}
        />
      </>
    );
  }

  const white = games.filter((g) => g.result === "1-0").length;
  const black = games.filter((g) => g.result === "0-1").length;
  const draws = games.length - white - black;
  const timeouts = games.filter((g) => g.endReason === "timeout").length;

  const upset = games
    .filter((g) => g.result !== "1/2-1/2")
    .map((g) => {
      const whiteWon = g.result === "1-0";
      const winnerBefore = whiteWon ? g.whiteBefore : g.blackBefore;
      const loserBefore = whiteWon ? g.blackBefore : g.whiteBefore;
      return { g, gap: loserBefore - winnerBefore, winner: whiteWon ? g.whiteId : g.blackId, loser: whiteWon ? g.blackId : g.whiteId };
    })
    .filter((u) => u.gap > 0)
    .sort((a, b) => b.gap - a.gap)[0];

  const pairs = new Map<string, { a: string; b: string; n: number }>();
  for (const g of games) {
    const [a, b] = [g.whiteId, g.blackId].sort();
    const p = pairs.get(a + b) ?? { a, b, n: 0 };
    p.n += 1;
    pairs.set(a + b, p);
  }
  const rivalry = [...pairs.values()].sort((x, y) => y.n - x.n)[0];

  const active = [...standings].sort((a, b) => b.games - a.games)[0];
  const streaks = standings
    .map((s) => ({ s, best: playerStats(s.player.id, standings, games).bestWinStreak }))
    .sort((a, b) => b.best - a.best)[0];
  const peak = [...standings].sort((a, b) => b.peak - a.peak)[0];

  const pct = (n: number) => Math.round((n / games.length) * 100);

  return (
    <>
      <PageHeader title="Stats" subtitle={`${games.length} games in the club`} />

      <Link href="/h2h" className="card mx-5 mb-4 flex items-center gap-3 px-4 py-3.5 active:scale-[0.99]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
          <Swords className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Head to head</div>
          <div className="text-xs text-muted">Compare any two players</div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted" />
      </Link>

      <section className="card mx-5 p-4">
        <h2 className="mb-3 text-sm font-semibold">Who wins?</h2>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          {white > 0 && <div style={{ flexGrow: white, background: WHITE_WINS }} />}
          {draws > 0 && <div style={{ flexGrow: draws, background: DRAWS }} />}
          {black > 0 && <div style={{ flexGrow: black, background: BLACK_WINS }} />}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-2">
          <Legend color={WHITE_WINS} label="White" n={white} pct={pct(white)} />
          <Legend color={DRAWS} label="Draw" n={draws} pct={pct(draws)} />
          <Legend color={BLACK_WINS} label="Black" n={black} pct={pct(black)} />
        </div>
        {timeouts > 0 && (
          <p className="mt-3 text-xs text-muted">
            {timeouts} {timeouts === 1 ? "game" : "games"} decided on time ({pct(timeouts)}%)
          </p>
        )}
      </section>

      <section className="card mx-5 mt-4 divide-y divide-line">
        <Fact label="Most active" player={active.player} value={`${active.games} games`} />
        {streaks.best > 0 && <Fact label="Longest win streak" player={streaks.s.player} value={`${streaks.best} in a row`} />}
        <Fact label="Highest peak" player={peak.player} value={`${peak.peak} Elo`} />
        {upset && (
          <Fact
            label="Biggest upset"
            player={byId.get(upset.winner)!}
            value={`beat ${byId.get(upset.loser)!.name} (+${upset.gap} gap)`}
          />
        )}
        {rivalry && rivalry.n > 1 && (
          <Link href={`/h2h?a=${rivalry.a}&b=${rivalry.b}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
            <div className="flex -space-x-3">
              <Avatar player={byId.get(rivalry.a)!} size={36} className="ring-2 ring-white" />
              <Avatar player={byId.get(rivalry.b)!} size={36} className="ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-muted">Top rivalry</div>
              <div className="truncate text-sm font-semibold">
                {byId.get(rivalry.a)!.name} vs {byId.get(rivalry.b)!.name}
              </div>
            </div>
            <span className="tabular text-sm text-ink-2">{rivalry.n} games</span>
          </Link>
        )}
      </section>

      <section className="card mx-5 mt-4 overflow-hidden">
        <h2 className="px-4 pt-4 pb-2 text-sm font-semibold">Player stats</h2>
        <table className="w-full text-sm">
          <thead className="text-[11px] text-muted">
            <tr>
              <th className="py-1.5 pl-4 text-left font-medium">Player</th>
              <th className="py-1.5 text-right font-medium">G</th>
              <th className="py-1.5 text-right font-medium">Score</th>
              <th className="py-1.5 pr-4 text-right font-medium">Elo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {standings.map((s) => (
              <tr key={s.player.id}>
                <td className="py-2 pl-4">
                  <Link href={`/players/${s.player.id}`} className="flex items-center gap-2">
                    <Avatar player={s.player} size={28} />
                    <span className="truncate font-medium">{s.player.name}</span>
                  </Link>
                </td>
                <td className="tabular py-2 text-right text-ink-2">{s.games}</td>
                <td className="tabular py-2 text-right text-ink-2">
                  {s.games ? `${Math.round(((s.wins + s.draws / 2) / s.games) * 100)}%` : "–"}
                </td>
                <td className="tabular py-2 pr-4 text-right font-semibold">{s.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

// Light, mid and dark grays mirror the pieces: white wins, draws, black wins.
const WHITE_WINS = "#dcdce3";
const DRAWS = "#9a9aa6";
const BLACK_WINS = "var(--ink)";

function Legend({ color, label, n, pct }: { color: string; label: string; n: number; pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: color }} />
      {label} <span className="tabular font-semibold text-ink">{n}</span>
      <span className="tabular text-muted">({pct}%)</span>
    </span>
  );
}

function Fact({ label, player, value }: { label: string; player: Player; value: string }) {
  return (
    <Link href={`/players/${player.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-surface-2">
      <Avatar player={player} size={36} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-muted">{label}</div>
        <div className="truncate text-sm font-semibold">{player.name}</div>
      </div>
      <span className="tabular shrink-0 text-sm text-ink-2">{value}</span>
    </Link>
  );
}
