"use client";

import { useState } from "react";
import { ArrowUpDown, Check, Minus, Plus, Shuffle } from "lucide-react";
import { previewDeltas, type TimeControl } from "@/lib/elo";
import { Avatar } from "../avatar";
import { Sheet } from "./sheet";
import { DEFAULT_TC, PRESETS, type PlayPlayer } from "./types";

export function MatchSetup({
  players,
  initial,
  onStart,
  onResultOnly,
}: {
  players: PlayPlayer[];
  initial: { whiteId?: string; blackId?: string; tc?: TimeControl };
  onStart: (whiteId: string, blackId: string, tc: TimeControl) => void;
  onResultOnly: (whiteId: string, blackId: string) => void;
}) {
  const valid = (id?: string) => (id && players.some((p) => p.id === id) ? id : undefined);
  const [whiteId, setWhiteId] = useState(valid(initial.whiteId));
  const [blackId, setBlackId] = useState(valid(initial.blackId) !== whiteId ? valid(initial.blackId) : undefined);
  const [tc, setTc] = useState<TimeControl>(initial.tc ?? DEFAULT_TC);
  const [picking, setPicking] = useState<"w" | "b" | null>(null);
  const [custom, setCustom] = useState(!PRESETS.some((p) => p.tc.base === tc.base && p.tc.inc === tc.inc));

  const white = players.find((p) => p.id === whiteId);
  const black = players.find((p) => p.id === blackId);
  const preview = white && black ? previewDeltas(white, black) : null;

  function pick(id: string) {
    if (picking === "w") {
      if (id === blackId) setBlackId(whiteId);
      setWhiteId(id);
    } else {
      if (id === whiteId) setWhiteId(blackId);
      setBlackId(id);
    }
    setPicking(null);
  }

  function swap() {
    setWhiteId(blackId);
    setBlackId(whiteId);
  }

  function shuffle() {
    if (Math.random() < 0.5) swap();
  }

  return (
    <div className="px-5">
      <div className="space-y-2">
        <Slot
          color="w"
          player={white}
          onClick={() => setPicking("w")}
          preview={preview && { win: preview["1-0"].white, draw: preview["1/2-1/2"].white, loss: preview["0-1"].white }}
        />
        <Slot
          color="b"
          player={black}
          onClick={() => setPicking("b")}
          preview={preview && { win: preview["0-1"].black, draw: preview["1/2-1/2"].black, loss: preview["1-0"].black }}
        />
      </div>
      <div className="mt-2 flex justify-center gap-2">
        <PillButton onClick={swap} disabled={!white && !black}>
          <ArrowUpDown className="h-4 w-4" /> Swap colors
        </PillButton>
        <PillButton onClick={shuffle} disabled={!white || !black}>
          <Shuffle className="h-4 w-4" /> Random
        </PillButton>
      </div>

      <section className="card mt-4 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Time control</h2>
          <span className="tabular text-sm text-muted">
            {tc.base / 60} min + {tc.inc} sec
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const on = !custom && p.tc.base === tc.base && p.tc.inc === tc.inc;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTc(p.tc);
                  setCustom(false);
                }}
                className={`flex h-14 flex-col items-center justify-center rounded-2xl text-[15px] font-semibold active:scale-95 ${
                  on ? "bg-ink text-white" : "bg-bg text-ink"
                }`}
              >
                <span className="tabular">{p.label}</span>
                <span className={`text-[10px] font-medium ${on ? "text-white/60" : "text-muted"}`}>{p.group}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={`col-span-2 h-14 rounded-2xl text-[15px] font-semibold active:scale-95 ${
              custom ? "bg-ink text-white" : "bg-bg text-ink"
            }`}
          >
            Custom
          </button>
        </div>
        {custom && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stepper
              label="Minutes"
              value={tc.base / 60}
              min={1}
              max={180}
              onChange={(m) => setTc({ ...tc, base: m * 60 })}
            />
            <Stepper label="Increment (s)" value={tc.inc} min={0} max={60} onChange={(inc) => setTc({ ...tc, inc })} />
          </div>
        )}
      </section>

      <button
        type="button"
        disabled={!white || !black}
        onClick={() => onStart(whiteId!, blackId!, tc)}
        className="mt-5 h-14 w-full rounded-full bg-ink text-[17px] font-semibold text-white shadow-lg shadow-black/10 active:scale-[0.99] disabled:opacity-30 disabled:shadow-none"
      >
        Start clock
      </button>
      <button
        type="button"
        disabled={!white || !black}
        onClick={() => onResultOnly(whiteId!, blackId!)}
        className="mt-2 h-12 w-full rounded-full text-[15px] font-semibold text-ink-2 active:bg-surface-2 disabled:opacity-30"
      >
        Just enter a result
      </button>

      {picking && (
        <Sheet title={picking === "w" ? "Who plays white?" : "Who plays black?"} onClose={() => setPicking(null)}>
          <ul className="divide-y divide-line">
            {players.map((p) => {
              const selected = p.id === (picking === "w" ? whiteId : blackId);
              const other = p.id === (picking === "w" ? blackId : whiteId);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-60"
                  >
                    <Avatar player={p} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.name}</div>
                      <div className="tabular text-xs text-muted">
                        {p.rating} Elo{other && ` · playing ${picking === "w" ? "black" : "white"}, will swap`}
                      </div>
                    </div>
                    {selected && <Check className="h-5 w-5" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function Slot({
  color,
  player,
  onClick,
  preview,
}: {
  color: "w" | "b";
  player?: PlayPlayer;
  onClick: () => void;
  preview: { win: number; draw: number; loss: number } | null;
}) {
  const dark = color === "b";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-3xl p-4 text-left active:scale-[0.99] ${
        dark ? "bg-ink text-white" : "card"
      }`}
    >
      {player ? (
        <Avatar player={player} size={56} />
      ) : (
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed text-2xl ${
            dark ? "border-white/30" : "border-line"
          }`}
        >
          <Plus className="h-6 w-6 opacity-50" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className={`text-xs font-semibold tracking-wide uppercase ${dark ? "text-white/60" : "text-muted"}`}>
          {dark ? "♚ Black" : "♔ White"}
        </div>
        <div className="truncate text-lg font-bold">{player ? player.name : "Choose player"}</div>
        {player && (
          <div className={`tabular text-xs ${dark ? "text-white/60" : "text-muted"}`}>
            {player.rating}
            {preview && (
              <>
                {" "}
                · win {fmt(preview.win)} · draw {fmt(preview.draw)} · loss {fmt(preview.loss)}
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

const fmt = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "±0");

function PillButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold text-ink shadow-sm ring-1 ring-line active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-bg p-2">
      <div className="px-1 text-[11px] font-medium text-muted">{label}</div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-surface-2"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="tabular text-xl font-bold">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-surface-2"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
