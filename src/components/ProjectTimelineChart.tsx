'use client';

import { useState, useCallback } from 'react';
import type { ProjectData, DayPoint } from '@/lib/types';
import { computeDailyTimeline } from '@/lib/linear';

interface ProjectTimelineChartProps {
  project: ProjectData;
  daysBack: number | null; // null = all time
}

const PAD = { top: 24, right: 24, bottom: 48, left: 52 };
const VIEW_W = 900;
const VIEW_H = 400;
const CHART_W = VIEW_W - PAD.left - PAD.right; // 824
const CHART_H = VIEW_H - PAD.top - PAD.bottom; // 328

function roundUpToNearest5(n: number): number {
  if (n <= 0) return 5;
  return Math.ceil(n / 5) * 5;
}

function toXY(
  index: number,
  value: number,
  totalPoints: number,
  yMax: number,
): { x: number; y: number } {
  const x = PAD.left + (index / Math.max(totalPoints - 1, 1)) * CHART_W;
  const y = PAD.top + CHART_H - (value / yMax) * CHART_H;
  return { x, y };
}

function polylinePoints(
  data: DayPoint[],
  accessor: (p: DayPoint) => number,
  yMax: number,
): string {
  return data
    .map((point, i) => {
      const { x, y } = toXY(i, accessor(point), data.length, yMax);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function ProjectTimelineChart({ project, daysBack }: ProjectTimelineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points: DayPoint[] = computeDailyTimeline(project.allIssues, daysBack);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>) => {
      if (points.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      // Scale from rendered width to viewBox width
      const svgX = (mouseX / rect.width) * VIEW_W;
      const chartX = svgX - PAD.left;
      const fraction = chartX / CHART_W;
      const index = Math.round(fraction * (points.length - 1));
      const clamped = Math.max(0, Math.min(points.length - 1, index));
      setHoverIndex(clamped);
    },
    [points],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  if (project.allIssues.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: '#555',
          fontSize: '14px',
        }}
      >
        No issues in this project.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          color: '#555',
          fontSize: '14px',
        }}
      >
        No data for this time range.
      </div>
    );
  }

  const maxScoped = Math.max(...points.map((p) => p.scoped));
  const yMax = roundUpToNearest5(maxScoped);

  // Y gridlines at 0%, 25%, 50%, 75%, 100% of yMax
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => Math.round(frac * yMax));

  // X label stride
  const stride = points.length > 60 ? 14 : 7;

  // Bar width
  const barWidth = Math.max(2, (CHART_W / points.length) * 0.8);

  // Scoped polyline points
  const scopedPts = polylinePoints(points, (p) => p.scoped, yMax);
  const completedPts = polylinePoints(points, (p) => p.completed, yMax);
  const inProgressPts = polylinePoints(points, (p) => p.inProgress, yMax);

  // Hover data
  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX =
    hoverIndex !== null
      ? PAD.left + (hoverIndex / Math.max(points.length - 1, 1)) * CHART_W
      : null;

  // Tooltip positioning
  const tooltipWidth = 140;
  const tooltipHeight = 96;
  let tooltipX = hoverX !== null ? hoverX + 8 : 0;
  if (tooltipX + tooltipWidth > VIEW_W - PAD.right) {
    tooltipX = (hoverX ?? 0) - tooltipWidth - 8;
  }
  const tooltipY = PAD.top + 4;

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="auto"
        style={{ display: 'block' }}
      >
        {/* Y gridlines and labels */}
        {yTicks.map((tickVal) => {
          const y = PAD.top + CHART_H - (tickVal / yMax) * CHART_H;
          return (
            <g key={tickVal}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + CHART_W}
                y2={y}
                stroke="#2a2a2a"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#666"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* X axis baseline */}
        <line
          x1={PAD.left}
          y1={PAD.top + CHART_H}
          x2={PAD.left + CHART_W}
          y2={PAD.top + CHART_H}
          stroke="#2a2a2a"
          strokeWidth={1}
        />

        {/* Bars (newScoped) */}
        {points.map((point, i) => {
          if (point.newScoped === 0) return null;
          const x = PAD.left + (i / Math.max(points.length - 1, 1)) * CHART_W;
          const barH = (point.newScoped / yMax) * CHART_H;
          return (
            <rect
              key={i}
              x={x - barWidth / 2}
              y={PAD.top + CHART_H - barH}
              width={barWidth}
              height={barH}
              fill="#3b4a6b"
              opacity={0.7}
            />
          );
        })}

        {/* Line: Scoped */}
        <polyline
          points={scopedPts}
          fill="none"
          stroke="#6b7280"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Line: Completed */}
        <polyline
          points={completedPts}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Line: In Progress */}
        <polyline
          points={inProgressPts}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots at first/last points for each line */}
        {[
          { accessor: (p: DayPoint) => p.scoped, color: '#6b7280' },
          { accessor: (p: DayPoint) => p.completed, color: '#22c55e' },
          { accessor: (p: DayPoint) => p.inProgress, color: '#3b82f6' },
        ].map(({ accessor, color }) =>
          [0, points.length - 1].map((idx) => {
            const { x, y } = toXY(idx, accessor(points[idx]), points.length, yMax);
            return (
              <circle key={`${color}-${idx}`} cx={x} cy={y} r={3} fill={color} />
            );
          }),
        )}

        {/* X axis labels */}
        {points.map((point, i) => {
          if (i % stride !== 0) return null;
          const x = PAD.left + (i / Math.max(points.length - 1, 1)) * CHART_W;
          const y = PAD.top + CHART_H + 6;
          return (
            <text
              key={i}
              x={x}
              y={y}
              fontSize={10}
              fill="#666"
              textAnchor="end"
              transform={`rotate(-35, ${x}, ${y})`}
            >
              {point.dateLabel}
            </text>
          );
        })}

        {/* Hover overlay */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={CHART_W}
          height={CHART_H}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair' }}
        />

        {/* Hover vertical line */}
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

        {/* Hover dots on each line */}
        {hoverIndex !== null &&
          hoverPoint !== null &&
          [
            { accessor: (p: DayPoint) => p.scoped, color: '#6b7280' },
            { accessor: (p: DayPoint) => p.completed, color: '#22c55e' },
            { accessor: (p: DayPoint) => p.inProgress, color: '#3b82f6' },
          ].map(({ accessor, color }) => {
            const { x, y } = toXY(hoverIndex, accessor(hoverPoint), points.length, yMax);
            return (
              <circle
                key={color}
                cx={x}
                cy={y}
                r={4}
                fill={color}
                stroke="#111"
                strokeWidth={1.5}
                pointerEvents="none"
              />
            );
          })}

        {/* Tooltip */}
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
              {hoverPoint.dateLabel}
            </text>
            <text x={tooltipX + 8} y={tooltipY + 33} fontSize={10} fill="#6b7280">
              Scoped:{' '}
              <tspan fill="#e5e5e5">{hoverPoint.scoped}</tspan>
            </text>
            <text x={tooltipX + 8} y={tooltipY + 49} fontSize={10} fill="#22c55e">
              Completed:{' '}
              <tspan fill="#e5e5e5">{hoverPoint.completed}</tspan>
            </text>
            <text x={tooltipX + 8} y={tooltipY + 65} fontSize={10} fill="#3b82f6">
              In Progress:{' '}
              <tspan fill="#e5e5e5">{hoverPoint.inProgress}</tspan>
            </text>
            <text x={tooltipX + 8} y={tooltipY + 81} fontSize={10} fill="#3b4a6b">
              New scope:{' '}
              <tspan fill="#e5e5e5">{hoverPoint.newScoped}</tspan>
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '8px',
          fontSize: '12px',
          color: '#888',
          paddingLeft: `${PAD.left}px`,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: '#6b7280', fontSize: '16px', lineHeight: 1 }}>■</span>
          Scoped (cumulative)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: '#22c55e', fontSize: '16px', lineHeight: 1 }}>■</span>
          Completed (cumulative)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: '#3b82f6', fontSize: '16px', lineHeight: 1 }}>■</span>
          In Progress
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ color: '#3b4a6b', fontSize: '16px', lineHeight: 1 }}>▮</span>
          New scope (daily/weekly)
        </span>
      </div>
    </div>
  );
}
