'use client';

import { useState, useCallback } from 'react';

export interface MonthlyPoint {
  label: string;
  value: number;
  partial: boolean;
}

interface MonthlyLineChartProps {
  points: MonthlyPoint[];
  color: string;
  tooltipLabel: string;
  axisFormat: (v: number) => string;
  valueFormat: (v: number) => string;
}

const PAD = { top: 24, right: 24, bottom: 40, left: 60 };
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

export default function MonthlyLineChart({
  points,
  color,
  tooltipLabel,
  axisFormat,
  valueFormat,
}: MonthlyLineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * CHART_W;
      const index = Math.round((svgX / CHART_W) * (points.length - 1));
      setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
    },
    [points],
  );

  if (points.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '320px',
          color: '#555',
          fontSize: '14px',
        }}
      >
        No data for this time range.
      </div>
    );
  }

  const yMax = niceMax(Math.max(...points.map((p) => p.value)));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const xAt = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * CHART_W;
  const yAt = (v: number) => PAD.top + CHART_H - (v / yMax) * CHART_H;

  // Last point may be partial: draw it dashed
  const lastPartial = points[points.length - 1].partial && points.length > 1;
  const solid = lastPartial ? points.slice(0, -1) : points;
  const solidPts = solid.map((p, i) => `${xAt(i)},${yAt(p.value)}`).join(' ');
  const dashedPts = lastPartial
    ? [points.length - 2, points.length - 1].map((i) => `${xAt(i)},${yAt(points[i].value)}`).join(' ')
    : '';

  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xAt(hoverIndex) : null;

  const tooltipWidth = 150;
  const tooltipHeight = 48;
  let tooltipX = hoverX !== null ? hoverX + 8 : 0;
  if (tooltipX + tooltipWidth > VIEW_W - PAD.right) {
    tooltipX = (hoverX ?? 0) - tooltipWidth - 8;
  }
  const tooltipY = PAD.top + 4;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="auto" style={{ display: 'block' }}>
      {yTicks.map((tickVal) => {
        const y = yAt(tickVal);
        return (
          <g key={tickVal}>
            <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y} stroke="#2a2a2a" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#666">
              {axisFormat(tickVal)}
            </text>
          </g>
        );
      })}

      <line
        x1={PAD.left}
        y1={PAD.top + CHART_H}
        x2={PAD.left + CHART_W}
        y2={PAD.top + CHART_H}
        stroke="#2a2a2a"
        strokeWidth={1}
      />

      <polyline
        points={solidPts}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {lastPartial && (
        <polyline
          points={dashedPts}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray="5,4"
          strokeLinecap="round"
        />
      )}

      {points.map((p, i) => (
        <circle
          key={p.label}
          cx={xAt(i)}
          cy={yAt(p.value)}
          r={3}
          fill={p.partial ? '#1a1a1a' : color}
          stroke={color}
          strokeWidth={p.partial ? 1.5 : 0}
        />
      ))}

      {points.map((p, i) => (
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

      {hoverX !== null && (
        <line
          x1={hoverX}
          y1={PAD.top}
          x2={hoverX}
          y2={PAD.top + CHART_H}
          stroke="#555"
          strokeWidth={1}
          strokeDasharray="4,3"
          pointerEvents="none"
        />
      )}

      {hoverPoint !== null && hoverIndex !== null && (
        <circle
          cx={xAt(hoverIndex)}
          cy={yAt(hoverPoint.value)}
          r={4}
          fill={color}
          stroke="#111"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      )}

      {hoverPoint !== null && hoverX !== null && (
        <g pointerEvents="none">
          <rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={5}
            ry={5}
            fill="#111"
            stroke="#333"
            strokeWidth={1}
          />
          <text x={tooltipX + 8} y={tooltipY + 16} fontSize={10} fill="#aaa">
            {hoverPoint.label}
            {hoverPoint.partial ? ' (parcial)' : ''}
          </text>
          <text x={tooltipX + 8} y={tooltipY + 33} fontSize={10} fill={color}>
            {tooltipLabel}: <tspan fill="#e5e5e5">{valueFormat(hoverPoint.value)}</tspan>
          </text>
        </g>
      )}
    </svg>
  );
}
