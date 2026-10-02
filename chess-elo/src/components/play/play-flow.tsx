"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordGame } from "@/app/actions";
import type { Result, TimeControl } from "@/lib/elo";
import { PageHeader } from "../ui";
import { ChessClock } from "./chess-clock";
import { FinishSheet } from "./finish-sheet";
import { MatchSetup } from "./match-setup";
import { MatchSummary } from "./match-summary";
import { newClock, type ClockState, type Finished, type Match, type PlayPlayer } from "./types";

const MATCH_KEY = "checkmate.match";
const LAST_KEY = "checkmate.lastSetup";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

type Last = { whiteId?: string; blackId?: string; tc?: TimeControl };

export function PlayFlow({ players }: { players: PlayPlayer[] }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [last, setLast] = useState<Last>({});
  const [match, setMatchState] = useState<Match | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  // A game in progress survives reloads and the phone locking.
  useEffect(() => {
    const saved = read<Match>(MATCH_KEY);
    const valid = saved && players.some((p) => p.id === saved.whiteId) && players.some((p) => p.id === saved.blackId);
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only readable after hydration */
    if (valid) {
      setMatchState(saved);
      setFinishing(!saved.clock || !!saved.clock.flagged);
    }
    setLast(read<Last>(LAST_KEY) ?? {});
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [players]);

  const setMatch = useCallback((m: Match | null) => {
    setMatchState(m);
    write(MATCH_KEY, m);
  }, []);

  const updateClock = useCallback(
    (clock: ClockState) => setMatchState((m) => (m ? persist({ ...m, clock }) : m)),
    [],
  );
  const onFlag = useCallback(
    (clock: ClockState) => {
      updateClock(clock);
      setFinishing(true);
    },
    [updateClock],
  );

  function start(whiteId: string, blackId: string, tc?: TimeControl) {
    const l = { whiteId, blackId, tc: tc ?? last.tc };
    setLast(l);
    write(LAST_KEY, l);
    setFinished(null);
    setError(undefined);
    setMatch({ whiteId, blackId, tc, clock: tc ? newClock(tc) : undefined });
    setFinishing(!tc);
  }

  function save(result: Result) {
    if (!match) return;
    const flagged = match.clock?.flagged;
    const timeout = (flagged === "w" && result === "0-1") || (flagged === "b" && result === "1-0");
    setError(undefined);
    startSaving(async () => {
      const res = await recordGame({
        whiteId: match.whiteId,
        blackId: match.blackId,
        result,
        timeControl: match.clock ? match.tc : undefined,
        endReason: timeout ? "timeout" : "board",
      });
      if (res.error !== undefined) {
        setError(res.error);
        return;
      }
      setFinished({ match, result, game: res.game });
      setFinishing(false);
      setMatch(null);
    });
  }

  if (!loaded) return null;

  const byId = (id: string) => players.find((p) => p.id === id)!;

  if (finished) {
    const { whiteId, blackId, tc } = finished.match;
    return (
      <MatchSummary
        finished={finished}
        white={byId(whiteId)}
        black={byId(blackId)}
        onRematch={() => start(blackId, whiteId, tc)}
        onNew={() => {
          setFinished(null);
          router.refresh();
        }}
      />
    );
  }

  if (match) {
    const white = byId(match.whiteId);
    const black = byId(match.blackId);
    return (
      <>
        {match.clock && match.tc ? (
          <ChessClock
            white={white}
            black={black}
            tc={match.tc}
            clock={match.clock}
            onChange={updateClock}
            onFlag={onFlag}
            onEnd={(clock) => {
              updateClock(clock);
              setFinishing(true);
            }}
            onExit={() => setMatch(null)}
          />
        ) : (
          <div className="px-5 pt-6 text-center text-sm text-muted">
            {white.name} vs {black.name}
          </div>
        )}
        {finishing && (
          <FinishSheet
            white={white}
            black={black}
            flagged={match.clock?.flagged ?? null}
            saving={saving}
            error={error}
            onSave={save}
            onCancel={() => {
              if (match.clock) setFinishing(false);
              else setMatch(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="New match" back="/" />
      <MatchSetup
        players={players}
        initial={last}
        onStart={(w, b, tc) => start(w, b, tc)}
        onResultOnly={(w, b) => start(w, b)}
      />
    </>
  );
}

function persist(m: Match) {
  write(MATCH_KEY, m);
  return m;
}
