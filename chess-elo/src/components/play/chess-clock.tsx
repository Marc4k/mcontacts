"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flag, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { TimeControl } from "@/lib/elo";
import { Avatar } from "../avatar";
import { isMuted, playClick, playFlag, playLowTime, setMuted, unlockAudio } from "./sounds";
import { formatClock, remainingNow, type ClockState, type PlayPlayer, type Side } from "./types";

const LOW_MS = 20_000;

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

/** Keeps the screen awake while the clock is visible. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if (document.visibilityState === "visible" && "wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) lock.release();
        }
      } catch {}
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, []);
}

export function ChessClock({
  white,
  black,
  tc,
  clock,
  onChange,
  onFlag,
  onEnd,
  onExit,
}: {
  white: PlayPlayer;
  black: PlayPlayer;
  tc: TimeControl;
  clock: ClockState;
  onChange: (clock: ClockState) => void;
  onFlag: (clock: ClockState) => void;
  onEnd: (clock: ClockState) => void;
  onExit: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const clockRef = useRef(clock);
  useLayoutEffect(() => {
    clockRef.current = clock;
  }, [clock]);
  const [muted, setMutedState] = useState(isMuted);
  const lastWarned = useRef<number | null>(null);
  useWakeLock();

  // Browsers only allow audio after a touch. Unlock on the first touch anywhere,
  // e.g. after a reload mid-game, so low-time ticks aren't silent.
  useEffect(() => {
    unlockAudio();
    window.addEventListener("pointerdown", unlockAudio, { capture: true });
    return () => window.removeEventListener("pointerdown", unlockAudio, { capture: true });
  }, []);

  const running = clock.runningSince !== null;

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      const t = Date.now();
      const c = clockRef.current;
      const left = c.runningSince !== null ? remainingNow(c, c.active, t) : Infinity;
      if (left <= 0) {
        buzz([300, 100, 300]);
        playFlag();
        const next = { ...c, remaining: { ...c.remaining, [c.active]: 0 }, runningSince: null, flagged: c.active };
        clockRef.current = next;
        onFlag(next);
        return;
      }
      // One tick per second for the last 10 seconds.
      const second = Math.ceil(left / 1000);
      if (left < 10_000 && second !== lastWarned.current) {
        lastWarned.current = second;
        playLowTime();
      }
      setNow(t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, onFlag]);

  /** Freezes the running segment into `remaining`. */
  function settle(c: ClockState, t: number): ClockState {
    if (c.runningSince === null) return c;
    return { ...c, remaining: { ...c.remaining, [c.active]: remainingNow(c, c.active, t) }, runningSince: null };
  }

  /** Updates the ref immediately so a fast double tap can't act on stale state. */
  function commit(next: ClockState) {
    clockRef.current = next;
    onChange(next);
  }

  function press(side: Side) {
    unlockAudio();
    const c = clockRef.current;
    if (c.flagged) return;
    const t = Date.now();
    if (!c.started) {
      // Like a real clock: black presses to start white's time.
      if (side !== "b") return;
      buzz(20);
      playClick();
      commit({ ...c, started: true, active: "w", runningSince: t });
      return;
    }
    if (c.runningSince === null || side !== c.active) return;
    const left = remainingNow(c, side, t);
    if (left <= 0) return;
    const other: Side = side === "w" ? "b" : "w";
    buzz(15);
    playClick();
    lastWarned.current = null;
    commit({
      ...c,
      remaining: { ...c.remaining, [side]: left + tc.inc * 1000 },
      moves: { ...c.moves, [side]: c.moves[side] + 1 },
      active: other,
      runningSince: t,
    });
  }

  function togglePause() {
    unlockAudio();
    const c = clockRef.current;
    if (!c.started || c.flagged) {
      if (!c.started) press("b");
      return;
    }
    const t = Date.now();
    commit(c.runningSince === null ? { ...c, runningSince: t } : settle(c, t));
  }

  return (
    <div className="fixed inset-0 z-40 flex touch-none flex-col bg-bg select-none">
      <Half
        side="b"
        player={black}
        clock={clock}
        now={now}
        inc={tc.inc}
        onPress={() => press("b")}
        rotated
      />

      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2">
        <ControlButton
          label="Leave"
          onClick={() => {
            if (!clock.started || confirm("Leave this game? It won't be saved.")) onExit();
          }}
        >
          <X className="h-5 w-5" />
        </ControlButton>
        <ControlButton
          label={muted ? "Turn sound on" : "Mute sound"}
          onClick={() => {
            unlockAudio();
            setMuted(!muted);
            setMutedState(!muted);
            if (muted) playClick();
          }}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </ControlButton>
        <button
          type="button"
          onClick={togglePause}
          disabled={!!clock.flagged}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-30"
        >
          {!clock.started ? (
            <>
              <Play className="h-5 w-5" fill="currentColor" /> Start
            </>
          ) : running ? (
            <>
              <Pause className="h-5 w-5" fill="currentColor" /> Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" fill="currentColor" /> Resume
            </>
          )}
        </button>
        <ControlButton label="End game" onClick={() => onEnd(settle(clockRef.current, Date.now()))}>
          <Flag className="h-5 w-5" />
        </ControlButton>
      </div>

      <Half side="w" player={white} clock={clock} now={now} inc={tc.inc} onPress={() => press("w")} />
    </div>
  );
}

function Half({
  side,
  player,
  clock,
  now,
  inc,
  onPress,
  rotated,
}: {
  side: Side;
  player: PlayPlayer;
  clock: ClockState;
  now: number;
  inc: number;
  onPress: () => void;
  rotated?: boolean;
}) {
  const ms = remainingNow(clock, side, now);
  const isTurn = clock.started && clock.active === side;
  const live = isTurn && clock.runningSince !== null;
  const flagged = clock.flagged === side;
  const low = ms < LOW_MS;

  let tone = "bg-surface text-ink";
  if (flagged) tone = "bg-loss text-white";
  else if (live) tone = low ? "bg-loss text-white" : "bg-ink text-white";
  else if (isTurn) tone = "bg-ink/80 text-white";

  let hint: string | null = null;
  if (!clock.started) hint = side === "b" ? "Tap here to start white's clock" : "White moves first";
  else if (flagged) hint = "Time's up";
  else if (isTurn && !live) hint = "Paused";

  return (
    <button
      type="button"
      onPointerDown={onPress}
      aria-label={`${player.name}'s clock, ${formatClock(ms)}`}
      className={`relative mx-3 flex flex-1 flex-col items-center justify-center rounded-[32px] transition-colors duration-150 ${tone} ${
        rotated ? "mt-3 rotate-180" : "mb-3"
      } ${!live && !flagged ? "shadow-sm ring-1 ring-line" : ""}`}
      style={rotated ? { marginTop: "max(0.75rem, env(safe-area-inset-top))" } : { marginBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="absolute top-5 left-5 flex items-center gap-2.5">
        <Avatar player={player} size={36} />
        <div className="text-left">
          <div className="text-sm leading-tight font-semibold">{player.name}</div>
          <div className={`text-xs ${live || flagged || isTurn ? "text-white/60" : "text-muted"}`}>
            {side === "w" ? "♔ White" : "♚ Black"}
          </div>
        </div>
      </div>
      <div className={`absolute top-5 right-5 text-right text-xs ${live || flagged || isTurn ? "text-white/60" : "text-muted"}`}>
        <div className="tabular">Moves {clock.moves[side]}</div>
        {inc > 0 && <div className="tabular">+{inc}s</div>}
      </div>

      <span className="tabular text-[clamp(4rem,24vw,8rem)] leading-none font-semibold tracking-tight">
        {formatClock(ms)}
      </span>
      {hint && (
        <span className={`mt-3 text-sm font-medium ${live || flagged || isTurn ? "text-white/70" : "text-muted"}`}>
          {hint}
        </span>
      )}
    </button>
  );
}

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-14 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-sm ring-1 ring-line active:scale-95"
    >
      {children}
    </button>
  );
}
