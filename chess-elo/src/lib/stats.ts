import type { RatedGame, Standing } from "./elo.ts";

export interface Record3 {
  wins: number;
  draws: number;
  losses: number;
}

export interface HeadToHead extends Record3 {
  opponentId: string;
  games: number;
  eloNet: number;
}

export interface PlayerGame {
  game: RatedGame;
  color: "white" | "black";
  opponentId: string;
  outcome: "W" | "D" | "L";
  before: number;
  delta: number;
  opponentBefore: number;
}

export interface PlayerStats {
  rank: number;
  lowest: number;
  scorePct: number | null;
  asWhite: Record3;
  asBlack: Record3;
  currentStreak: { kind: "W" | "D" | "L"; count: number } | null;
  bestWinStreak: number;
  bestWin: PlayerGame | null;
  biggestGain: PlayerGame | null;
  timeouts: { won: number; lost: number };
  headToHead: HeadToHead[];
  games: PlayerGame[];
}

const empty = (): Record3 => ({ wins: 0, draws: 0, losses: 0 });

function tally(r: Record3, outcome: "W" | "D" | "L") {
  if (outcome === "W") r.wins += 1;
  else if (outcome === "D") r.draws += 1;
  else r.losses += 1;
}

/** `games` must be newest first, as returned by computeRatings. */
export function playerStats(id: string, standings: Standing[], games: RatedGame[]): PlayerStats {
  const mine: PlayerGame[] = games
    .filter((g) => g.whiteId === id || g.blackId === id)
    .map((game) => {
      const white = game.whiteId === id;
      const score = game.result === "1/2-1/2" ? 0.5 : (game.result === "1-0") === white ? 1 : 0;
      return {
        game,
        color: white ? "white" : "black",
        opponentId: white ? game.blackId : game.whiteId,
        outcome: score === 1 ? "W" : score === 0 ? "L" : "D",
        before: white ? game.whiteBefore : game.blackBefore,
        delta: white ? game.whiteDelta : game.blackDelta,
        opponentBefore: white ? game.blackBefore : game.whiteBefore,
      };
    });

  const asWhite = empty();
  const asBlack = empty();
  const h2h = new Map<string, HeadToHead>();
  let bestWin: PlayerGame | null = null;
  let biggestGain: PlayerGame | null = null;
  const timeouts = { won: 0, lost: 0 };

  for (const g of mine) {
    tally(g.color === "white" ? asWhite : asBlack, g.outcome);
    const h = h2h.get(g.opponentId) ?? { opponentId: g.opponentId, games: 0, eloNet: 0, ...empty() };
    h.games += 1;
    h.eloNet += g.delta;
    tally(h, g.outcome);
    h2h.set(g.opponentId, h);
    if (g.outcome === "W" && (!bestWin || g.opponentBefore > bestWin.opponentBefore)) bestWin = g;
    if (g.delta > 0 && (!biggestGain || g.delta > biggestGain.delta)) biggestGain = g;
    if (g.game.endReason === "timeout") {
      if (g.outcome === "W") timeouts.won += 1;
      else if (g.outcome === "L") timeouts.lost += 1;
    }
  }

  let currentStreak: PlayerStats["currentStreak"] = null;
  for (const g of mine) {
    if (!currentStreak) currentStreak = { kind: g.outcome, count: 1 };
    else if (g.outcome === currentStreak.kind) currentStreak.count += 1;
    else break;
  }

  let bestWinStreak = 0;
  let run = 0;
  for (const g of mine) {
    run = g.outcome === "W" ? run + 1 : 0;
    bestWinStreak = Math.max(bestWinStreak, run);
  }

  const standing = standings.find((s) => s.player.id === id);
  const points = standing ? standing.wins + standing.draws / 2 : 0;

  return {
    rank: standings.findIndex((s) => s.player.id === id) + 1,
    lowest: standing ? Math.min(...standing.history.map((h) => h.rating)) : 0,
    scorePct: mine.length ? Math.round((points / mine.length) * 100) : null,
    asWhite,
    asBlack,
    currentStreak,
    bestWinStreak,
    bestWin,
    biggestGain,
    timeouts,
    headToHead: [...h2h.values()].sort((a, b) => b.games - a.games),
    games: mine,
  };
}

export interface Matchup {
  games: RatedGame[];
  /** Results from A's point of view. */
  a: Record3 & { points: number; eloNet: number; asWhite: Record3; biggestWin: RatedGame | null };
  b: Record3 & { points: number; eloNet: number; asWhite: Record3; biggestWin: RatedGame | null };
  streak: { holder: "a" | "b" | "draw"; count: number } | null;
}

/** `games` must be newest first. */
export function matchup(aId: string, bId: string, games: RatedGame[]): Matchup {
  const between = games.filter(
    (g) => (g.whiteId === aId && g.blackId === bId) || (g.whiteId === bId && g.blackId === aId),
  );
  const side = () => ({ ...empty(), points: 0, eloNet: 0, asWhite: empty(), biggestWin: null as RatedGame | null });
  const a = side();
  const b = side();
  const gain = (g: RatedGame, id: string) => (g.whiteId === id ? g.whiteDelta : g.blackDelta);

  for (const g of between) {
    const aWhite = g.whiteId === aId;
    const winner = g.result === "1/2-1/2" ? null : (g.result === "1-0") === aWhite ? "a" : "b";
    const outA = winner === "a" ? "W" : winner === "b" ? "L" : "D";
    const outB = winner === "b" ? "W" : winner === "a" ? "L" : "D";
    tally(a, outA);
    tally(b, outB);
    tally(aWhite ? a.asWhite : b.asWhite, aWhite ? outA : outB);
    a.points += outA === "W" ? 1 : outA === "D" ? 0.5 : 0;
    b.points += outB === "W" ? 1 : outB === "D" ? 0.5 : 0;
    a.eloNet += gain(g, aId);
    b.eloNet += gain(g, bId);
    if (winner === "a" && (!a.biggestWin || gain(g, aId) > gain(a.biggestWin, aId))) a.biggestWin = g;
    if (winner === "b" && (!b.biggestWin || gain(g, bId) > gain(b.biggestWin, bId))) b.biggestWin = g;
  }

  let streak: Matchup["streak"] = null;
  for (const g of between) {
    const aWhite = g.whiteId === aId;
    const holder = g.result === "1/2-1/2" ? "draw" : (g.result === "1-0") === aWhite ? "a" : "b";
    if (!streak) streak = { holder, count: 1 };
    else if (streak.holder === holder) streak.count += 1;
    else break;
  }

  return { games: between, a, b, streak };
}
