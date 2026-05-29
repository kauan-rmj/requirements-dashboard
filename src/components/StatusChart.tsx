'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import type { DashboardData, StatusCount } from '@/lib/types';

interface StatusChartProps {
  data: DashboardData;
  onRefresh: () => void;
  loading: boolean;
  pendingCount?: number;
}

const AUTO_REFRESH_MS = 60_000;

const AVATAR_COLORS = ['#4f8ef7', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6'];

function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash * 31) + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function LeadAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const bg = avatarBg(name);
  return (
    <div title={name} style={{ flexShrink: 0 }}>
      {avatarUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 700,
            color: '#fff',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}

function pctColor(pct: number): string {
  if (pct >= 90) return '#4ade80'; // green
  if (pct >= 70) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function PendingRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px' }}>
      <div className="animate-pulse" style={{ width: '200px', height: '14px', background: '#242424', borderRadius: '4px', flexShrink: 0 }} />
      <div className="animate-pulse" style={{ flex: 1, height: '28px', background: '#242424', borderRadius: '4px' }} />
      <div className="animate-pulse" style={{ width: '44px', height: '14px', background: '#242424', borderRadius: '4px', flexShrink: 0 }} />
      <div className="animate-pulse" style={{ width: '60px', height: '12px', background: '#242424', borderRadius: '4px', flexShrink: 0 }} />
    </div>
  );
}

export default function StatusChart({ data, onRefresh, loading, pendingCount = 0 }: StatusChartProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hovered, setHovered] = useState<{
    projectId: string;
    stateId: string;
    relX?: number;
    count?: number;
    pct?: number;
    color?: string;
    name?: string;
  } | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(onRefresh, AUTO_REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onRefresh]);

  const legendMap = new Map<string, StatusCount & { globalCount: number; id: string }>();
  let grandTotal = 0;

  for (const project of data.projects) {
    for (const [stateId, sc] of Object.entries(project.statusCounts)) {
      const existing = legendMap.get(stateId);
      if (existing) {
        existing.globalCount += sc.count;
      } else {
        legendMap.set(stateId, { ...sc, globalCount: sc.count, id: stateId });
      }
      grandTotal += sc.count;
    }
  }

  const typeOrder: Record<string, number> = {
    triage: 0, backlog: 1, unstarted: 2, started: 3, completed: 4, cancelled: 5,
  };
  const stateSort = (a: StatusCount, b: StatusCount) => {
    const tDiff = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
    return tDiff !== 0 ? tDiff : (a.position ?? 0) - (b.position ?? 0);
  };

  const legendItems = Array.from(legendMap.values()).sort(stateSort);

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
            const dimmed = hovered !== null && hovered.stateId !== item.id;
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
                onMouseEnter={() => setHovered({ projectId: '', stateId: item.id })}
                onMouseLeave={() => setHovered(null)}
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
          const statusEntries = Object.entries(project.statusCounts)
            .map(([id, sc]) => ({ ...sc, id }))
            .sort(stateSort);

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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '7px',
                  }}
                >
                  {project.lead && (
                    <LeadAvatar name={project.lead.name} avatarUrl={project.lead.avatarUrl} />
                  )}
                  <span
                    title={project.name}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#ccc',
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
                    position: 'relative',
                    minWidth: 0,
                  }}
                >
                  {/* Tooltip */}
                  {hovered?.projectId === project.id && hovered.relX !== undefined && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${hovered.relX}px`,
                        bottom: 'calc(100% + 6px)',
                        transform: 'translateX(-50%)',
                        background: 'rgba(20,20,20,0.92)',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        padding: '4px 9px',
                        fontSize: '11px',
                        color: '#888',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span style={{ color: hovered.color, fontSize: '9px' }}>●</span>
                      <span>{hovered.pct}%</span>
                      <span style={{ color: '#555' }}>·</span>
                      <span>{hovered.count} issues</span>
                    </div>
                  )}
                  {/* Visual bar */}
                  <div
                    style={{
                      height: '28px',
                      display: 'flex',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#111',
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
                        const isThisBar = hovered?.projectId === project.id;
                        const isActive = isThisBar && hovered?.stateId === sc.id;
                        const dimmed = isThisBar && hovered?.stateId !== sc.id;
                        return (
                          <div
                            key={sc.name}
                            style={{
                              width: `${segPct}%`,
                              background: sc.color,
                              flexShrink: 0,
                              cursor: 'pointer',
                              opacity: dimmed ? 0.2 : 1,
                              transition: 'opacity 150ms ease, filter 150ms ease',
                              filter: isActive ? 'brightness(1.15)' : 'none',
                            }}
                            onMouseEnter={(e) => {
                              const segEl = e.currentTarget as HTMLElement;
                              const barEl = segEl.parentElement as HTMLElement;
                              const segRect = segEl.getBoundingClientRect();
                              const barRect = barEl.getBoundingClientRect();
                              const relX = segRect.left - barRect.left + segRect.width / 2;
                              setHovered({
                                projectId: project.id,
                                stateId: sc.id,
                                relX,
                                count: sc.count,
                                pct: Math.round(segPct),
                                color: sc.color,
                                name: sc.name,
                              });
                            }}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => router.push(`/requirements?stateId=${sc.id}&projectId=${project.id}`)}
                          />
                        );
                      })
                    )}
                  </div>
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
        {pendingCount > 0 && Array.from({ length: pendingCount }).map((_, i) => (
          <div key={`pending-${i}`}>
            {(data.projects.length > 0 || i > 0) && (
              <div style={{ height: '1px', background: '#232323', margin: '0 24px' }} />
            )}
            <PendingRow />
          </div>
        ))}
      </div>
    </div>
  );
}
