'use client';

import { useState } from 'react';
import type { TimelinePoint } from '@/lib/types';

interface TimelineChartProps {
  data: TimelinePoint[];
}

const PROJECT_COLORS = ['#4f8ef7', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

interface TooltipState {
  x: number;
  y: number;
  label: string;
}

export default function TimelineChart({ data }: TimelineChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (data.length === 0) {
    return (
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #3a3a3a',
          borderRadius: '10px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#555',
          fontSize: '14px',
        }}
      >
        No timeline data available.
      </div>
    );
  }

  // Gather unique projects from the first data point that has projects
  const projectMeta: { id: string; name: string; color: string }[] = [];
  const seen = new Set<string>();
  for (const point of data) {
    for (const p of point.projects) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        projectMeta.push({ id: p.id, name: p.name, color: PROJECT_COLORS[projectMeta.length % PROJECT_COLORS.length] });
      }
    }
  }

  if (projectMeta.length === 0) {
    return (
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #3a3a3a',
          borderRadius: '10px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#555',
          fontSize: '14px',
        }}
      >
        No projects in timeline data.
      </div>
    );
  }

  // SVG layout constants
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 36;
  const svgHeight = 400;
  // Width is determined by container — use viewBox with a reference width
  const svgWidth = 900;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const n = data.length;

  // Map index → x coordinate within chart area
  const xOf = (i: number): number => {
    if (n <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (i / (n - 1)) * chartWidth;
  };

  // Map pct (0-100) → y coordinate
  const yOf = (pct: number): number => {
    return paddingTop + chartHeight - (pct / 100) * chartHeight;
  };

  const gridPcts = [0, 25, 50, 75, 100];

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #3a3a3a',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#e5e5e5',
            letterSpacing: '-0.01em',
          }}
        >
          Completion Rate Over Time
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>
          Weekly completion percentage per project
        </p>
      </div>

      {/* Chart */}
      <div style={{ padding: '16px 24px 8px', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: `${svgHeight}px`, display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y-axis gridlines and labels */}
          {gridPcts.map((pct) => {
            const y = yOf(pct);
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#2a2a2a"
                  strokeWidth={1}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#555"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((point, i) => (
            <text
              key={i}
              x={xOf(i)}
              y={svgHeight - 4}
              textAnchor="middle"
              fontSize={10}
              fill="#555"
            >
              {point.weekLabel}
            </text>
          ))}

          {/* Lines and dots per project */}
          {projectMeta.map((pm) => {
            const color = pm.color;

            // Build points for this project
            const pts = data.map((point, i) => {
              const proj = point.projects.find((p) => p.id === pm.id);
              const pct = proj?.pct ?? 0;
              return { x: xOf(i), y: yOf(pct), pct, weekLabel: point.weekLabel };
            });

            const polylinePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

            return (
              <g key={pm.id}>
                {/* Line — only when more than one point */}
                {pts.length > 1 && (
                  <polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={0.85}
                  />
                )}

                {/* Dots */}
                {pts.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill={color}
                    stroke="#1a1a1a"
                    strokeWidth={1.5}
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => {
                      const svgEl = (e.currentTarget as SVGCircleElement).closest('svg') as SVGSVGElement | null;
                      if (!svgEl) return;
                      const rect = svgEl.getBoundingClientRect();
                      const scaleX = rect.width / svgWidth;
                      const scaleY = rect.height / svgHeight;
                      setTooltip({
                        x: pt.x * scaleX + rect.left - (svgEl.parentElement?.getBoundingClientRect().left ?? 0),
                        y: pt.y * scaleY + rect.top - (svgEl.parentElement?.getBoundingClientRect().top ?? 0),
                        label: `${pm.name}: ${pt.pct}% (${pt.weekLabel})`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x + 10,
              top: tooltip.y - 12,
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#e5e5e5',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            {tooltip.label}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid #2a2a2a',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {projectMeta.map((pm) => (
          <div key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: pm.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '12px', color: '#aaa' }}>{pm.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
