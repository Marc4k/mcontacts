"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate } from "./ui";

const H = 180;
const PAD = { top: 16, right: 40, bottom: 22, left: 40 };

function niceStep(range: number) {
  for (const step of [5, 10, 20, 25, 50, 100, 200, 250, 500]) if (range / step <= 4) return step;
  return 1000;
}

export function RatingChart({ history }: { history: { at: string; rating: number }[] }) {
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

  const ratings = history.map((h) => h.rating);
  const step = niceStep(Math.max(...ratings) - Math.min(...ratings) || 10);
  const lo = Math.floor((Math.min(...ratings) - step / 4) / step) * step;
  const hi = Math.ceil((Math.max(...ratings) + step / 4) / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += step) ticks.push(t);

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (history.length === 1 ? plotW / 2 : (i / (history.length - 1)) * plotW);
  const y = (r: number) => PAD.top + (1 - (r - lo) / (hi - lo)) * plotH;

  const line = history.map((h, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(h.rating).toFixed(1)}`).join("");
  const area = `${line}L${x(history.length - 1).toFixed(1)},${PAD.top + plotH}L${x(0).toFixed(1)},${PAD.top + plotH}Z`;
  const last = history.length - 1;

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.left;
    const i = Math.round((px / plotW) * (history.length - 1));
    setHover(Math.min(Math.max(i, 0), last));
  }

  const h = hover !== null ? history[hover] : null;

  return (
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
          aria-label={`Rating over ${last} games, from ${history[0].rating} to ${history[last].rating}`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[10px]">
                {t}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={H - 4} className="fill-muted text-[10px]">
            Start
          </text>
          <text x={width - PAD.right} y={H - 4} textAnchor="end" className="fill-muted text-[10px]">
            Game {last}
          </text>
          <path d={area} fill="var(--accent)" opacity={0.1} />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last)} cy={y(history[last].rating)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          <text
            x={x(last) + 8}
            y={y(history[last].rating)}
            dy="0.32em"
            className="tabular fill-ink text-[11px] font-semibold"
          >
            {history[last].rating}
          </text>
          {h && hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--muted)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(h.rating)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-xl bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover), 50), width - 50),
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="tabular text-sm font-semibold">{h.rating}</div>
          <div className="text-white/70">
            {hover === 0 ? "Start" : `Game ${hover}`} · {formatDate(h.at)}
          </div>
        </div>
      )}
    </div>
  );
}
