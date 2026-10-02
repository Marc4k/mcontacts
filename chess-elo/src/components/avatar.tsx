/* eslint-disable @next/next/no-img-element -- photos come from our own route with cache-busting query */
import type { Player } from "@/lib/elo";

const TINTS = ["#fde2e4", "#e2ecfd", "#e3f6e8", "#fdf1d8", "#ece3fd", "#d9f3f5", "#fde6d6"];
const INKS = ["#9b2c3a", "#2c4f9b", "#2c7a46", "#8a6212", "#5a3a9b", "#1f6f75", "#9b4f1f"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function photoUrl(player: Pick<Player, "id" | "photoVersion">) {
  return player.photoVersion ? `/photos/${player.id}?v=${player.photoVersion}` : null;
}

export function Avatar({
  player,
  size = 44,
  className = "",
  ring,
}: {
  player: Pick<Player, "id" | "name" | "photoVersion">;
  size?: number;
  className?: string;
  ring?: string;
}) {
  const url = photoUrl(player);
  const i = hash(player.id) % TINTS.length;
  const style = {
    width: size,
    height: size,
    boxShadow: ring ? `0 0 0 3px var(--surface), 0 0 0 5px ${ring}` : undefined,
  };
  if (url) {
    return (
      <img
        src={url}
        alt={player.name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full bg-surface-2 object-cover ${className}`}
        style={style}
      />
    );
  }
  return (
    <span
      aria-label={player.name}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
      style={{ ...style, background: TINTS[i], color: INKS[i], fontSize: size * 0.38 }}
    >
      {initials(player.name)}
    </span>
  );
}
