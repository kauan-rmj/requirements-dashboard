'use client';

import { useState, useCallback } from 'react';
import type { ChartMode, MonthlyPoint } from '@/components/MonthlyChart';

interface Series {
  name: string;
  color: string;
  points: MonthlyPoint[];
  axisFormat: (v: number) => string;
  valueFormat: (v: number) => string;
}

interface DualAxisChartProps {
  mode: ChartMode;
  left: Series[]; // share the primary (left) y axis
  right: Series;
}

const PAD = { top: 24, right: 64, bottom: 40, left: 60 };
const VIEW_W = 900;
const VIEW_H = 320;
const CHART_W = VIEW_W - PAD.left - PAD.right;
const CHART_H = VIEW_H - PAD.top - PAD.bottom;

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

export default function DualAxisChart({ mode, left, right }: DualAxisChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const all = [...left, right];
  const n = left[0]?.points.length ?? 0;
  const isBar = mode === 'bar';

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * CHART_W;
      const index = isBar ? Math.floor((svgX / CHART_W) * n) : Math.round((svgX / CHART_W) * (n - 1));
      setHoverIndex(Math.max(0, Math.min(n - 1, index)));
    },
    [n, isBar],
  );

  if (n === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px', color: '#555', fontSize: '14px' }}>
        No data for this time range.
      </div>
    );
  }

  const slot = CHART_W / n;
  const barW = Math.min(22, (slot * 0.8) / all.length - 1);
  const xAt = (i: number) =>
    isBar ? PAD.left + slot * (i + 0.5) : PAD.left + (i / Math.max(n - 1, 1)) * CHART_W;
  const scaleFor = (group: Series[]) => {
    const yMax = niceMax(Math.max(...group.flatMap((s) => s.points.map((p) => p.value))));
    return { yMax, yAt: (v: number) => PAD.top + CHART_H - (v / yMax) * CHART_H };
  };
  const L = scaleFor(left);
  const R = scaleFor([right]);
  const leftColor = left.length === 1 ? left[0].color : '#888';
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const renderBars = (s: Series, yAt: (v: number) => number, offset: number) => {
    if (hidden[s.name]) return null;
    return (
      <g key={s.name}>
        {s.points.map((p, i) => {
          const y = yAt(p.value);
          return (
            <rect
              key={p.label}
              x={xAt(i) + offset}
              y={y}
              width={barW}
              height={PAD.top + CHART_H - y}
              rx={2}
              fill={s.color}
              fillOpacity={p.partial ? 0.35 : 0.9}
              stroke={s.color}
              strokeWidth={p.partial ? 1.5 : 0}
              strokeDasharray={p.partial ? '4,3' : undefined}
            />
          );
        })}
      </g>
    );
  };

  const renderLine = (s: Series, yAt: (v: number) => number) => {
    if (hidden[s.name]) return null;
    const lastPartial = s.points[n - 1].partial && n > 1;
    const solid = lastPartial ? s.points.slice(0, -1) : s.points;
    return (
      <g key={s.name}>
        <polyline
          points={solid.map((p, i) => `${xAt(i)},${yAt(p.value)}`).join(' ')}
          fill="none"
          stroke={s.color}
          strokeWidth={s === right ? 5 : 2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {lastPartial && (
          <polyline
            points={[n - 2, n - 1].map((i) => `${xAt(i)},${yAt(s.points[i].value)}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={s === right ? 5 : 2.5}
            strokeDasharray="5,4"
            strokeLinecap="round"
          />
        )}
        {s.points.map((p, i) => (
          <circle
            key={p.label}
            cx={xAt(i)}
            cy={yAt(p.value)}
            r={3}
            fill={p.partial ? '#1a1a1a' : s.color}
            stroke={s.color}
            strokeWidth={p.partial ? 1.5 : 0}
          />
        ))}
      </g>
    );
  };

  const hoverX = hoverIndex !== null ? xAt(hoverIndex) : null;
  const tooltipWidth = 200;
  const tooltipHeight = 24 + all.length * 16 + 8;
  let tooltipX = hoverX !== null ? hoverX + 8 : 0;
  if (tooltipX + tooltipWidth > VIEW_W - PAD.right) tooltipX = (hoverX ?? 0) - tooltipWidth - 8;
  const tooltipY = PAD.top + 4;

  return (
    <div>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ display: 'block' }}>
        {ticks.map((f) => {
          const y = PAD.top + CHART_H - f * CHART_H;
          return (
            <g key={f}>
              <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="#2a2a2a" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill={leftColor}>
                {left[0].axisFormat(f * L.yMax)}
              </text>
              <text x={PAD.left + CHART_W + 6} y={y + 4} textAnchor="start" fontSize={10} fill={right.color}>
                {right.axisFormat(f * R.yMax)}
              </text>
            </g>
          );
        })}

        {isBar
          ? all.map((s, j) => renderBars(s, s === right ? R.yAt : L.yAt, (j - all.length / 2) * (barW + 1)))
          : /* right series first and thicker, so a left series that overlaps it stays visible */
            [right, ...left].map((s) => renderLine(s, s === right ? R.yAt : L.yAt))}

        {left[0].points.map((p, i) => (
          <text key={p.label} x={xAt(i)} y={PAD.top + CHART_H + 18} fontSize={10} fill="#666" textAnchor="middle">
            {p.label}
          </text>
        ))}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={CHART_W}
          height={CHART_H}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ cursor: 'crosshair' }}
        />

        {hoverX !== null && hoverIndex !== null && (
          <>
            {isBar ? (
            <rect x={PAD.left + slot * hoverIndex} y={PAD.top} width={slot} height={CHART_H} fill="#ffffff" fillOpacity={0.04} pointerEvents="none" />
            ) : (
              <>
                <line x1={hoverX} y1={PAD.top} x2={hoverX} y2={PAD.top + CHART_H} stroke="#555" strokeWidth={1} strokeDasharray="4,3" pointerEvents="none" />
                {all.map((s) => ({ s, sc: s === right ? R : L })).map(({ s, sc }) =>
                  hidden[s.name] ? null : (
                    <circle key={s.name} cx={hoverX} cy={sc.yAt(s.points[hoverIndex].value)} r={4} fill={s.color} stroke="#111" strokeWidth={1.5} pointerEvents="none" />
                  ),
                )}
              </>
            )}
            <g pointerEvents="none">
              <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={5} ry={5} fill="#111" stroke="#333" strokeWidth={1} />
              <text x={tooltipX + 8} y={tooltipY + 16} fontSize={10} fill="#aaa">
                {left[0].points[hoverIndex].label}
                {left[0].points[hoverIndex].partial ? ' (parcial)' : ''}
              </text>
              {all.map((s, j) => (
                <text key={s.name} x={tooltipX + 8} y={tooltipY + 33 + j * 16} fontSize={10} fill={s.color}>
                  {s.name}: <tspan fill="#e5e5e5">{s.valueFormat(s.points[hoverIndex].value)}</tspan>
                </text>
              ))}
            </g>
          </>
        )}
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', paddingLeft: `${PAD.left}px` }}>
        {all.map((s) => {
          const off = hidden[s.name];
          return (
            <button
              key={s.name}
              onClick={() => setHidden((h) => ({ ...h, [s.name]: !h[s.name] }))}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: '1px solid #3a3a3a',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '12px',
                color: off ? '#555' : '#888',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: off ? '#444' : s.color, fontSize: '16px', lineHeight: 1 }}>■</span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
