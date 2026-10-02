export type Result = "1-0" | "0-1" | "1/2-1/2";

export interface Player {
  id: string;
  name: string;
  createdAt: string;
  /** Set when the player has a photo; bumps on every upload for cache busting. */
  photoVersion?: number;
}

export interface TimeControl {
  /** Starting time per side in seconds. */
  base: number;
  /** Increment added after each move in seconds. */
  inc: number;
}

export interface Game {
  id: string;
  whiteId: string;
  blackId: string;
  result: Result;
  playedAt: string;
  timeControl?: TimeControl;
  /** How the game ended: decided over the board, or a clock ran out. */
  endReason?: "board" | "timeout";
}

export interface RatedGame extends Game {
  whiteBefore: number;
  blackBefore: number;
  whiteDelta: number;
  blackDelta: number;
}

export interface Standing {
  player: Player;
  rating: number;
  peak: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  provisional: boolean;
  /** Rating change from the most recent game, 0 if none. */
  lastDelta: number;
  /** Rating after each game, oldest first (starts with the initial rating). */
  history: { at: string; rating: number }[];
  /** Last results from this player's point of view, newest first. */
  form: ("W" | "D" | "L")[];
}

export const INITIAL_RATING = 1200;
export const PROVISIONAL_GAMES = 30;

/** Probability that a player rated `a` scores against a player rated `b`. */
export function expectedScore(a: number, b: number): number {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

/** FIDE-style K-factor: 40 while provisional, 10 once at 2400+, 20 otherwise. */
export function kFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < PROVISIONAL_GAMES) return 40;
  if (rating >= 2400) return 10;
  return 20;
}

export function whiteScore(result: Result): number {
  return result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5;
}

/**
 * Replays every game in chronological order and derives ratings from scratch.
 * Ratings are never stored, so editing or deleting any game stays consistent.
 */
export function computeRatings(players: Player[], games: Game[]) {
  const standings = new Map<string, Standing>();
  for (const player of players) {
    standings.set(player.id, {
      player,
      rating: INITIAL_RATING,
      peak: INITIAL_RATING,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      provisional: true,
      lastDelta: 0,
      history: [{ at: player.createdAt, rating: INITIAL_RATING }],
      form: [],
    });
  }

  const ordered = [...games].sort(
    (a, b) => a.playedAt.localeCompare(b.playedAt) || a.id.localeCompare(b.id),
  );
  const rated: RatedGame[] = [];

  for (const game of ordered) {
    const white = standings.get(game.whiteId);
    const black = standings.get(game.blackId);
    if (!white || !black) continue;

    const sw = whiteScore(game.result);
    const ew = expectedScore(white.rating, black.rating);
    const whiteDelta = Math.round(kFactor(white.rating, white.games) * (sw - ew));
    const blackDelta = Math.round(kFactor(black.rating, black.games) * (ew - sw));

    rated.push({
      ...game,
      whiteBefore: white.rating,
      blackBefore: black.rating,
      whiteDelta,
      blackDelta,
    });

    apply(white, whiteDelta, sw, game.playedAt);
    apply(black, blackDelta, 1 - sw, game.playedAt);
  }

  const table = [...standings.values()].sort(
    (a, b) => b.rating - a.rating || b.games - a.games || a.player.name.localeCompare(b.player.name),
  );
  return { standings: table, games: rated.reverse() };
}

function apply(s: Standing, delta: number, score: number, at: string) {
  s.rating += delta;
  s.lastDelta = delta;
  s.peak = Math.max(s.peak, s.rating);
  s.games += 1;
  s.provisional = s.games < PROVISIONAL_GAMES;
  s.history.push({ at, rating: s.rating });
  const mark: "W" | "D" | "L" = score === 1 ? "W" : score === 0 ? "L" : "D";
  if (mark === "W") s.wins += 1;
  else if (mark === "L") s.losses += 1;
  else s.draws += 1;
  s.form = [mark, ...s.form].slice(0, 5);
}

export interface Rated {
  rating: number;
  games: number;
}

/** Rating changes for white and black for each possible result, before the game is played. */
export function previewDeltas(white: Rated, black: Rated): Record<Result, { white: number; black: number }> {
  const ew = expectedScore(white.rating, black.rating);
  const kw = kFactor(white.rating, white.games);
  const kb = kFactor(black.rating, black.games);
  const at = (sw: number) => ({
    white: Math.round(kw * (sw - ew)),
    black: Math.round(kb * (ew - sw)),
  });
  return { "1-0": at(1), "1/2-1/2": at(0.5), "0-1": at(0) };
}
