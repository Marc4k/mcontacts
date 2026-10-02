"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "./ui";

export interface Series {
  name: string;
  color: string;
  points: { at: string; rating: number }[];
}

const H = 200;
const PAD = { top: 14, right: 44, bottom: 22, left: 40 };

function niceStep(range: number) {
  for (const step of [5, 10, 20, 25, 50, 100, 200, 250, 500]) if (range / step <= 4) return step;
  return 1000;
}

/** Rating at time t: the last value at or before t (ratings hold between games). */
function valueAt(points: { t: number; rating: number }[], t: number) {
  let v: number | null = null;
  for (const p of points) {
    if (p.t <= t) v = p.rating;
    else break;
  }
  return v;
}

/**
 * Two (or more) rating lines over time. Step lines, because a rating stays flat
 * until the next game. `marks` are timestamps highlighted with a dot on every line.
 */
export function ComparisonChart({ series, marks = [] }: { series: Series[]; marks?: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lines = series.map((s) => ({
    ...s,
    pts: s.points.map((p) => ({ t: Date.parse(p.at), rating: p.rating })).sort((a, b) => a.t - b.t),
  }));
  const all = lines.flatMap((l) => l.pts);
  const t0 = Math.min(...all.map((p) => p.t));
  const t1 = Math.max(...all.map((p) => p.t), t0 + 1);
  const ratings = all.map((p) => p.rating);
  const step = niceStep(Math.max(...ratings) - Math.min(...ratings) || 10);
  const lo = Math.floor((Math.min(...ratings) - step / 4) / step) * step;
  const hi = Math.ceil((Math.max(...ratings) + step / 4) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * plotW;
  const y = (r: number) => PAD.top + (1 - (r - lo) / (hi - lo)) * plotH;

  const path = (pts: { t: number; rating: number }[]) => {
    let d = "";
    pts.forEach((p, i) => {
      d += i === 0 ? `M${x(p.t)},${y(p.rating)}` : `H${x(p.t)}V${y(p.rating)}`;
    });
    return d + `H${x(t1)}`;
  };

  // Hover snaps to the nearest moment anything changed.
  const stops = [...new Set(all.map((p) => p.t))].sort((a, b) => a - b);
  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    let best = stops[0];
    for (const s of stops) if (Math.abs(x(s) - px) < Math.abs(x(best) - px)) best = s;
    setHover(best);
  }

  // End labels only when they don't collide; the legend and tooltip cover the rest.
  const ends = lines.map((l) => l.pts[l.pts.length - 1]?.rating ?? 0);
  const labelEnds = ends.length < 2 || Math.abs(y(ends[0]) - y(ends[1])) >= 14;
  const markTimes = marks.map((m) => Date.parse(m));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        {lines.map((l) => (
          <span key={l.name} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: l.color }} />
            {l.name}
          </span>
        ))}
        {markTimes.length > 0 && (
          <span className="flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full border border-ink-2" /> played each other
          </span>
        )}
      </div>
      <div ref={ref} className="relative select-none" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            className="touch-pan-y"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label={`Ratings over time: ${lines.map((l, i) => `${l.name} ${ends[i]}`).join(", ")}`}
          >
            {ticks.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[10px]">
                  {v}
                </text>
              </g>
            ))}
            <text x={PAD.left} y={H - 4} className="fill-muted text-[10px]">
              {formatDate(new Date(t0).toISOString())}
            </text>
            <text x={width - PAD.right} y={H - 4} textAnchor="end" className="fill-muted text-[10px]">
              {formatDate(new Date(t1).toISOString())}
            </text>
            {lines.map((l) => (
              <path
                key={l.name}
                d={path(l.pts)}
                fill="none"
                stroke={l.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {lines.map((l) =>
              markTimes.map((t) => {
                const v = valueAt(l.pts, t);
                return v === null ? null : (
                  <circle key={`${l.name}-${t}`} cx={x(t)} cy={y(v)} r={4} fill="var(--surface)" stroke={l.color} strokeWidth={2} />
                );
              }),
            )}
            {labelEnds &&
              lines.map((l, i) => (
                <text
                  key={l.name}
                  x={x(t1) + 6}
                  y={y(ends[i])}
                  dy="0.32em"
                  className="tabular fill-ink text-[11px] font-semibold"
                >
                  {ends[i]}
                </text>
              ))}
            {hover !== null && (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--muted)" strokeWidth={1} />
                {lines.map((l) => {
                  const v = valueAt(l.pts, hover);
                  return v === null ? null : (
                    <circle key={l.name} cx={x(hover)} cy={y(v)} r={5} fill={l.color} stroke="var(--surface)" strokeWidth={2} />
                  );
                })}
              </g>
            )}
          </svg>
        )}
        {hover !== null && (
          <div
            className="pointer-events-none absolute rounded-xl bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
            // Beside the crosshair, on whichever side has room, so it never covers the legend.
            style={
              x(hover) < width / 2
                ? { top: PAD.top, left: x(hover) + 10 }
                : { top: PAD.top, left: x(hover) - 10, transform: "translateX(-100%)" }
            }
          >
            <div className="mb-0.5 text-white/70">{formatDate(new Date(hover).toISOString())}</div>
            {lines.map((l) => {
              const v = valueAt(l.pts, hover);
              return (
                <div key={l.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                  <span className="max-w-24 truncate">{l.name}</span>
                  <span className="tabular ml-auto pl-2 font-semibold">{v ?? "–"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
