import type { RatedGame, Result, TimeControl } from "@/lib/elo";

export interface PlayPlayer {
  id: string;
  name: string;
  photoVersion?: number;
  rating: number;
  games: number;
}

export type Side = "w" | "b";

export interface ClockState {
  /** Remaining ms per side at the start of the current running segment. */
  remaining: { w: number; b: number };
  active: Side;
  /** Epoch ms when the active side's time started running; null while paused or not started. */
  runningSince: number | null;
  started: boolean;
  moves: { w: number; b: number };
  flagged: Side | null;
}

export interface Match {
  whiteId: string;
  blackId: string;
  /** Absent when the result is entered without using the clock. */
  tc?: TimeControl;
  clock?: ClockState;
}

export interface Finished {
  match: Match;
  result: Result;
  game: RatedGame;
}

export const PRESETS: { label: string; group: string; tc: TimeControl }[] = [
  { group: "Bullet", label: "1+0", tc: { base: 60, inc: 0 } },
  { group: "Bullet", label: "2+1", tc: { base: 120, inc: 1 } },
  { group: "Blitz", label: "3+2", tc: { base: 180, inc: 2 } },
  { group: "Blitz", label: "5+0", tc: { base: 300, inc: 0 } },
  { group: "Blitz", label: "5+3", tc: { base: 300, inc: 3 } },
  { group: "Rapid", label: "10+0", tc: { base: 600, inc: 0 } },
  { group: "Rapid", label: "10+5", tc: { base: 600, inc: 5 } },
  { group: "Rapid", label: "15+10", tc: { base: 900, inc: 10 } },
  { group: "Classical", label: "30+0", tc: { base: 1800, inc: 0 } },
  { group: "Classical", label: "30+20", tc: { base: 1800, inc: 20 } },
];

export const DEFAULT_TC: TimeControl = { base: 600, inc: 5 };

export function newClock(tc: TimeControl): ClockState {
  return {
    remaining: { w: tc.base * 1000, b: tc.base * 1000 },
    active: "w",
    runningSince: null,
    started: false,
    moves: { w: 0, b: 0 },
    flagged: null,
  };
}

/** Live remaining time for a side, accounting for the running segment. */
export function remainingNow(clock: ClockState, side: Side, now: number) {
  const base = clock.remaining[side];
  if (side !== clock.active || clock.runningSince === null) return base;
  return Math.max(0, base - (now - clock.runningSince));
}

export function formatClock(ms: number) {
  if (ms < 10_000) {
    const tenths = Math.floor(ms / 100);
    return `0:0${Math.floor(tenths / 10)}.${tenths % 10}`;
  }
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
