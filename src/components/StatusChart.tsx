'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import type { DashboardData, StatusCount } from '@/lib/types';

interface StatusChartProps {
  data: DashboardData;
  onRefresh: () => void;
  loading: boolean;
}

const AUTO_REFRESH_MS = 60_000;

function pctColor(pct: number): string {
  if (pct >= 90) return '#4ade80'; // green
  if (pct >= 70) return '#fbbf24'; // amber
  return '#f87171'; // red
}

export default function StatusChart({ data, onRefresh, loading }: StatusChartProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(onRefresh, AUTO_REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onRefresh]);

  // Build global legend: unique states across all projects, sorted by type order
  const typeOrder: Record<string, number> = {
    triage: 0,
    backlog: 1,
    unstarted: 2,
    started: 3,
    completed: 4,
    cancelled: 5,
  };

  const legendMap = new Map<string, StatusCount & { globalCount: number }>();
  let grandTotal = 0;

  for (const project of data.projects) {
    for (const [stateId, sc] of Object.entries(project.statusCounts)) {
      const existing = legendMap.get(stateId);
      if (existing) {
        existing.globalCount += sc.count;
      } else {
        legendMap.set(stateId, { ...sc, globalCount: sc.count });
      }
      grandTotal += sc.count;
    }
  }

  const legendItems = Array.from(legendMap.values()).sort(
    (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99),
  );

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#e5e5e5',
              letterSpacing: '-0.01em',
            }}
          >
            Project Status Overview
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>
            Issue distribution by workflow state per module
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            Updated: {data.updatedAt}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#888',
              opacity: loading ? 0.6 : 1,
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.background = '#323232';
                (e.currentTarget as HTMLButtonElement).style.color = '#e5e5e5';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
              (e.currentTarget as HTMLButtonElement).style.color = '#888';
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Legend */}
      {legendItems.length > 0 && (
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {legendItems.map((item) => {
            const pct = grandTotal > 0 ? Math.round((item.globalCount / grandTotal) * 100) : 0;
            const dimmed = hoveredStateId !== null && hoveredStateId !== item.id;
            return (
              <div
                key={`${item.name}-${item.type}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: dimmed ? 0.25 : 1,
                  transition: 'opacity 150ms ease',
                  cursor: 'default',
                }}
                onMouseEnter={() => setHoveredStateId(item.id)}
                onMouseLeave={() => setHoveredStateId(null)}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  {item.name}
                </span>
                <span style={{ fontSize: '11px', color: '#555' }}>
                  {pct}%
                </span>
                <span style={{ fontSize: '11px', color: '#444' }}>
                  ({item.globalCount})
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart rows */}
      <div style={{ padding: '8px 0' }}>
        {data.projects.length === 0 && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#555',
              fontSize: '14px',
            }}
          >
            No projects found. Check your LINEAR_API_KEY and LINEAR_PROJECT_IDS configuration.
          </div>
        )}
        {data.projects.map((project, idx) => {
          const statusEntries = Object.values(project.statusCounts).sort(
            (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99),
          );

          return (
            <div key={project.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  gap: '16px',
                }}
              >
                {/* Module name */}
                <div
                  style={{
                    width: '200px',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  <span
                    title={project.name}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#ccc',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {project.name}
                  </span>
                </div>

                {/* Stacked bar */}
                <div
                  style={{
                    flex: 1,
                    height: '28px',
                    display: 'flex',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#111',
                    minWidth: 0,
                  }}
                >
                  {project.total === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        background: '#252525',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#555' }}>No issues</span>
                    </div>
                  ) : (
                    statusEntries.map((sc) => {
                      const segPct = (sc.count / project.total) * 100;
                      if (segPct < 0.5) return null;
                      const dimmed = hoveredStateId !== null && hoveredStateId !== sc.id;
                      return (
                        <div
                          key={sc.name}
                          className="bar-segment"
                          style={{
                            width: `${segPct}%`,
                            background: sc.color,
                            position: 'relative',
                            flexShrink: 0,
                            cursor: 'pointer',
                            opacity: dimmed ? 0.2 : 1,
                            transition: 'opacity 150ms ease, filter 150ms ease',
                            filter: hoveredStateId === sc.id ? 'brightness(1.15)' : 'none',
                          }}
                          onMouseEnter={() => setHoveredStateId(sc.id)}
                          onMouseLeave={() => setHoveredStateId(null)}
                          onClick={() => router.push(`/requirements?type=${sc.type}`)}
                        >
                          <div className="bar-tooltip">
                            <span style={{ color: sc.color, marginRight: '4px' }}>■</span>
                            {sc.name}: {sc.count} issues ({Math.round(segPct)}%)
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* % label */}
                <div
                  style={{
                    width: '44px',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: pctColor(project.pct),
                    }}
                  >
                    {project.pct}%
                  </span>
                </div>

                {/* Count label */}
                <div
                  style={{
                    width: '60px',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#555' }}>
                    {project.completed}/{project.total}
                  </span>
                </div>
              </div>

              {idx < data.projects.length - 1 && (
                <div
                  style={{
                    height: '1px',
                    background: '#232323',
                    margin: '0 24px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
