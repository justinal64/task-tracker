"use client";

import { useState } from "react";
import type { PointsHistorySeries } from "@/lib/pointsHistory";

const WIDTH = 640;
const HEIGHT = 280;
const PAD_LEFT = 40;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function niceMax(value: number): number {
  const v = Math.max(value, 1);
  if (v <= 10) return 10;
  if (v <= 50) return Math.ceil(v / 10) * 10;
  if (v <= 250) return Math.ceil(v / 25) * 25;
  if (v <= 500) return Math.ceil(v / 50) * 50;
  return Math.ceil(v / 100) * 100;
}

function formatDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[Number(month) - 1]} ${Number(day)}`;
}

export default function PointsHistoryChart({
  days,
  series,
}: {
  days: string[];
  series: PointsHistorySeries[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const showDirectLabels = series.length > 0 && series.length <= 4;

  const padRight = showDirectLabels ? 88 : 16;
  const plotWidth = WIDTH - PAD_LEFT - padRight;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxValue = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const stepX = days.length > 1 ? plotWidth / (days.length - 1) : 0;

  function xFor(i: number) {
    return PAD_LEFT + stepX * i;
  }
  function yFor(value: number) {
    return PAD_TOP + plotHeight - (value / maxValue) * plotHeight;
  }

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  // Spread direct end-labels apart vertically so they don't collide when
  // series converge near the same final value.
  const endLabels = showDirectLabels
    ? [...series]
        .map((s) => ({ s, y: yFor(s.values[s.values.length - 1] ?? 0) }))
        .sort((a, b) => a.y - b.y)
        .reduce<{ s: PointsHistorySeries; y: number }[]>((acc, cur) => {
          const prev = acc[acc.length - 1];
          if (prev && cur.y - prev.y < 14) cur.y = prev.y + 14;
          acc.push(cur);
          return acc;
        }, [])
    : [];

  const hoverDay = hoverIndex !== null ? days[hoverIndex] : null;

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const i = stepX > 0 ? Math.round((relX - PAD_LEFT) / stepX) : 0;
    setHoverIndex(Math.min(days.length - 1, Math.max(0, i)));
  }

  const tooltipPct = hoverIndex !== null && days.length > 1 ? (hoverIndex / (days.length - 1)) * 100 : 50;
  const tooltipTransform = tooltipPct < 15 ? "translateX(0)" : tooltipPct > 85 ? "translateX(-100%)" : "translateX(-50%)";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Points over time per kid">
          {gridSteps.map((step) => {
            const y = PAD_TOP + plotHeight * (1 - step);
            return (
              <g key={step}>
                <line
                  x1={PAD_LEFT}
                  x2={WIDTH - padRight}
                  y1={y}
                  y2={y}
                  stroke="var(--hairline)"
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
                  {Math.round(maxValue * step)}
                </text>
              </g>
            );
          })}

          <text x={PAD_LEFT} y={HEIGHT - 6} fontSize={10} fill="var(--muted)">
            {days[0] && formatDate(days[0])}
          </text>
          <text x={WIDTH - padRight} y={HEIGHT - 6} fontSize={10} fill="var(--muted)" textAnchor="end">
            {days[days.length - 1] && formatDate(days[days.length - 1])}
          </text>

          {series.map((s) => {
            const d = s.values.map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(v)}`).join(" ");
            const lastValue = s.values[s.values.length - 1] ?? 0;
            return (
              <g key={s.id}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={xFor(s.values.length - 1)} cy={yFor(lastValue)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
              </g>
            );
          })}

          {endLabels.map(({ s, y }) => (
            <text key={s.id} x={WIDTH - padRight + 10} y={y + 4} fontSize={11} fill="var(--foreground)">
              {s.avatarEmoji} {s.name}
            </text>
          ))}

          {hoverIndex !== null && (
            <>
              <line
                x1={xFor(hoverIndex)}
                x2={xFor(hoverIndex)}
                y1={PAD_TOP}
                y2={PAD_TOP + plotHeight}
                stroke="var(--muted)"
                strokeWidth={1}
              />
              {series.map((s) => (
                <circle
                  key={s.id}
                  cx={xFor(hoverIndex)}
                  cy={yFor(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hoverIndex !== null && hoverDay && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm shadow-lg"
            style={{ left: `${tooltipPct}%`, transform: tooltipTransform }}
          >
            <p className="mb-1 font-medium text-muted">{formatDate(hoverDay)}</p>
            {series.map((s) => (
              <p key={s.id} className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
                <span className="font-semibold text-foreground">{s.values[hoverIndex]}</span>
                <span className="text-muted">{s.name}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      {series.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5 text-sm text-muted">
              <span className="inline-block h-0.5 w-3" style={{ backgroundColor: s.color }} />
              {s.avatarEmoji} {s.name}
            </span>
          ))}
        </div>
      )}

      <details className="text-sm text-muted">
        <summary className="cursor-pointer select-none">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-hairline py-1 pr-3 font-medium">Date</th>
                {series.map((s) => (
                  <th key={s.id} className="border-b border-hairline py-1 pr-3 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={day}>
                  <td className="border-b border-hairline py-1 pr-3">{formatDate(day)}</td>
                  {series.map((s) => (
                    <td key={s.id} className="border-b border-hairline py-1 pr-3">
                      {s.values[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
