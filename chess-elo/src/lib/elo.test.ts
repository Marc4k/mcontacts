import { test } from "node:test";
import assert from "node:assert/strict";
import { computeRatings, expectedScore, kFactor, previewDeltas, INITIAL_RATING } from "./elo.ts";
import { matchup, playerStats } from "./stats.ts";

test("expected score is 0.5 for equal ratings and symmetric", () => {
  assert.equal(expectedScore(1500, 1500), 0.5);
  assert.ok(Math.abs(expectedScore(1600, 1400) + expectedScore(1400, 1600) - 1) < 1e-12);
  assert.ok(Math.abs(expectedScore(1600, 1200) - 0.909) < 0.001);
});

test("k-factor follows FIDE thresholds", () => {
  assert.equal(kFactor(1200, 0), 40);
  assert.equal(kFactor(2500, 29), 40);
  assert.equal(kFactor(2000, 30), 20);
  assert.equal(kFactor(2400, 30), 10);
});

const players = [
  { id: "a", name: "Alice", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "b", name: "Bob", createdAt: "2026-01-01T00:00:00.000Z" },
];

test("a win between new players moves ratings by 20", () => {
  const { standings, games } = computeRatings(players, [
    { id: "g1", whiteId: "a", blackId: "b", result: "1-0", playedAt: "2026-01-02T00:00:00.000Z" },
  ]);
  const alice = standings.find((s) => s.player.id === "a")!;
  const bob = standings.find((s) => s.player.id === "b")!;
  assert.equal(alice.rating, INITIAL_RATING + 20);
  assert.equal(bob.rating, INITIAL_RATING - 20);
  assert.equal(games[0].whiteDelta, 20);
  assert.equal(games[0].blackDelta, -20);
  assert.deepEqual([alice.wins, bob.losses], [1, 1]);
});

test("games are replayed chronologically regardless of input order", () => {
  const g = (id: string, result: "1-0" | "0-1" | "1/2-1/2", day: number) => ({
    id, whiteId: "a", blackId: "b", result, playedAt: `2026-01-0${day}T00:00:00.000Z`,
  });
  const forward = computeRatings(players, [g("1", "1-0", 2), g("2", "1/2-1/2", 3)]);
  const shuffled = computeRatings(players, [g("2", "1/2-1/2", 3), g("1", "1-0", 2)]);
  assert.deepEqual(
    forward.standings.map((s) => s.rating),
    shuffled.standings.map((s) => s.rating),
  );
  assert.equal(forward.games[0].id, "2", "newest game first");
  const alice = forward.standings.find((s) => s.player.id === "a")!;
  assert.deepEqual(alice.form, ["D", "W"]);
  assert.equal(alice.peak, 1220);
});

test("preview deltas match what computeRatings applies", () => {
  const preview = previewDeltas({ rating: 1200, games: 0 }, { rating: 1200, games: 0 });
  assert.deepEqual(preview["1-0"], { white: 20, black: -20 });
  assert.deepEqual(preview["1/2-1/2"], { white: 0, black: 0 });
  assert.deepEqual(preview["0-1"], { white: -20, black: 20 });
});

test("player stats track streaks, colors and head-to-head", () => {
  const g = (id: string, w: string, b: string, result: "1-0" | "0-1" | "1/2-1/2", day: number) => ({
    id, whiteId: w, blackId: b, result, playedAt: `2026-01-0${day}T00:00:00.000Z`,
  });
  const { standings, games } = computeRatings(players, [
    g("1", "a", "b", "1-0", 2),
    g("2", "b", "a", "0-1", 3),
    g("3", "a", "b", "1/2-1/2", 4),
    g("4", "b", "a", "1-0", 5),
  ]);
  const s = playerStats("a", standings, games);
  assert.deepEqual(s.asWhite, { wins: 1, draws: 1, losses: 0 });
  assert.deepEqual(s.asBlack, { wins: 1, draws: 0, losses: 1 });
  assert.deepEqual(s.currentStreak, { kind: "L", count: 1 });
  assert.equal(s.bestWinStreak, 2);
  assert.equal(s.scorePct, 63);
  assert.equal(s.headToHead[0].games, 4);
});

test("matchup counts results from both sides", () => {
  const trio = [...players, { id: "c", name: "Cleo", createdAt: "2026-01-01T00:00:00.000Z" }];
  const g = (id: string, w: string, b: string, result: "1-0" | "0-1" | "1/2-1/2", day: number) => ({
    id, whiteId: w, blackId: b, result, playedAt: `2026-01-0${day}T00:00:00.000Z`,
  });
  const { games } = computeRatings(trio, [
    g("1", "a", "b", "1-0", 2),
    g("2", "a", "c", "0-1", 3),
    g("3", "b", "a", "1-0", 4),
    g("4", "b", "a", "1-0", 5),
    g("5", "a", "b", "1/2-1/2", 6),
  ]);
  const m = matchup("a", "b", games);
  assert.equal(m.games.length, 4, "game vs Cleo excluded");
  assert.deepEqual([m.a.wins, m.a.draws, m.a.losses], [1, 1, 2]);
  assert.deepEqual([m.b.wins, m.b.draws, m.b.losses], [2, 1, 1]);
  assert.equal(m.a.points + m.b.points, 4);
  assert.equal(m.a.eloNet, -m.b.eloNet, "equal K-factors, so gains mirror");
  assert.deepEqual(m.a.asWhite, { wins: 1, draws: 1, losses: 0 });
  assert.deepEqual(m.b.asWhite, { wins: 2, draws: 0, losses: 0 });
  assert.deepEqual(m.streak, { holder: "draw", count: 1 });
  assert.equal(m.a.biggestWin?.id, "1");
});
