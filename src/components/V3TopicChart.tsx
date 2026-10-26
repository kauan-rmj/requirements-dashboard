'use client';

import { useState } from 'react';
import V3Avatar from './V3Avatar';
import V3Select from './V3Select';
import { MILESTONE_OWNERS, V3_STATUSES, type V3Status, type V3Test, type V3User } from '@/lib/v3-tests';

type ViewMode = 'padrao' | 'tamanho' | 'nao_validados';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'padrao', label: 'Padrão (barras iguais)' },
  { value: 'tamanho', label: 'Proporcional · por tamanho' },
  { value: 'nao_validados', label: 'Proporcional · por não validados' },
];

const VALIDATED: V3Status[] = ['validado_nao_qa', 'validado_qa'];

function pctColor(pct: number): string {
  if (pct >= 90) return '#4ade80';
  if (pct >= 70) return '#fbbf24';
  return '#f87171';
}

interface Hover {
  topic: string; // '' = legend hover
  status: V3Status;
  relX?: number;
  count?: number;
  pct?: number;
  color?: string;
}

export default function V3TopicChart({ tests, users }: { tests: V3Test[]; users: V3User[] }) {
  const [hovered, setHovered] = useState<Hover | null>(null);
  const [hoveredPct, setHoveredPct] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('padrao');

  const byTopic = new Map<string, Record<string, number>>();
  for (const t of tests) {
    const key = t.milestone.trim() || '(sem milestone)';
    const row = byTopic.get(key) ?? {};
    row[t.status] = (row[t.status] ?? 0) + 1;
    byTopic.set(key, row);
  }
  const topics = [...byTopic.entries()].map(([name, counts]) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const validated = VALIDATED.reduce((a, s) => a + (counts[s] ?? 0), 0);
    return { name, counts, total, validated, pct: total ? Math.round((validated / total) * 100) : 0 };
  });
  const NO_MILESTONE = '(sem milestone)';
  if (view !== 'padrao') {
    topics.sort((a, b) => {
      if ((a.name === NO_MILESTONE) !== (b.name === NO_MILESTONE)) return a.name === NO_MILESTONE ? 1 : -1;
      if (view === 'tamanho') return b.total - a.total;
      return (b.total - b.validated) - (a.total - a.validated) || b.total - a.total;
    });
  }
  const grandTotal = tests.length;
  const maxTotal = Math.max(1, ...topics.map((t) => t.total));

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '10px', border: '1px solid #3a3a3a', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#e5e5e5', letterSpacing: '-0.01em' }}>
          Testes por milestone
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>
          Distribuição dos testes por status em cada milestone
        </p>
        </div>
        <div style={{ width: '260px', flexShrink: 0 }}>
          <V3Select value={view} options={VIEW_OPTIONS} onChange={(v) => setView(v as ViewMode)} />
        </div>
      </div>

      <div style={{ padding: '14px 24px', borderBottom: '1px solid #2a2a2a', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        {V3_STATUSES.map((s) => {
          const count = tests.filter((t) => t.status === s.value).length;
          const pct = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
          const dimmed = hovered !== null && hovered.status !== s.value;
          return (
            <div
              key={s.value}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: dimmed ? 0.25 : 1, transition: 'opacity 150ms ease', cursor: 'default' }}
              onMouseEnter={() => setHovered({ topic: '', status: s.value })}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#aaa' }}>{s.label}</span>
              <span style={{ fontSize: '11px', color: '#555' }}>{pct}%</span>
              <span style={{ fontSize: '11px', color: '#444' }}>({count})</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '8px 0' }}>
        {topics.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#555', fontSize: '14px' }}>Nenhum teste cadastrado.</div>
        )}
        {topics.map((topic, idx) => (
          <div key={topic.name}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', gap: '16px' }}>
              <div style={{ width: '200px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {(() => {
                  const owner = users.find((u) => u.id === MILESTONE_OWNERS[topic.name]);
                  return owner && <V3Avatar name={owner.name} avatarUrl={owner.avatarUrl} size={20} />;
                })()}
                <span
                  title={topic.name}
                  style={{ fontSize: '13px', fontWeight: 500, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {topic.name}
                </span>
              </div>

              <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                {hovered?.topic === topic.name && hovered.relX !== undefined && (
                  <div
                    style={{
                      position: 'absolute', left: `${hovered.relX}px`, bottom: 'calc(100% + 6px)', transform: 'translateX(-50%)',
                      background: 'rgba(20,20,20,0.92)', border: '1px solid #333', borderRadius: '6px', padding: '4px 9px',
                      fontSize: '11px', color: '#888', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20,
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                  >
                    <span style={{ color: hovered.color, fontSize: '9px' }}>●</span>
                    <span>{hovered.pct}%</span>
                    <span style={{ color: '#555' }}>·</span>
                    <span>{hovered.count} testes</span>
                  </div>
                )}
                <div style={{ height: '28px', width: view === 'padrao' ? '100%' : `${(topic.total / maxTotal) * 100}%`, minWidth: '4px', display: 'flex', borderRadius: '4px', overflow: 'hidden', background: '#111' }}>
                  {V3_STATUSES.map((s) => {
                    const count = topic.counts[s.value] ?? 0;
                    const segPct = (count / topic.total) * 100;
                    if (segPct < 0.5) return null;
                    const isLegendHover = hovered?.topic === '';
                    const isThisBar = hovered?.topic === topic.name;
                    const isActive = hovered !== null && hovered.status === s.value && (isLegendHover || isThisBar);
                    const dimmed = hovered !== null && hovered.status !== s.value && (isLegendHover || isThisBar);
                    return (
                      <div
                        key={s.value}
                        style={{
                          width: `${segPct}%`, background: s.color, flexShrink: 0, cursor: 'default',
                          opacity: dimmed ? 0.2 : 1, transition: 'opacity 150ms ease, filter 150ms ease',
                          filter: isActive ? 'brightness(1.15)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          const seg = e.currentTarget.getBoundingClientRect();
                          const bar = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                          setHovered({
                            topic: topic.name, status: s.value, relX: seg.left - bar.left + seg.width / 2,
                            count, pct: Math.round(segPct), color: s.color,
                          });
                        }}
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })}
                </div>
              </div>

              <div
                style={{ width: '44px', flexShrink: 0, textAlign: 'right', position: 'relative' }}
                onMouseEnter={() => setHoveredPct(topic.name)}
                onMouseLeave={() => setHoveredPct(null)}
              >
                {hoveredPct === topic.name && (
                  <div
                    style={{
                      position: 'absolute', right: 0, bottom: 'calc(100% + 6px)', background: 'rgba(20,20,20,0.92)',
                      border: '1px solid #333', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#888',
                      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 20, textAlign: 'left',
                    }}
                  >
                    <div style={{ color: '#aaa', lineHeight: '1.5' }}>
                      Testes <span style={{ color: '#22c55e' }}>validados por QA</span> +{' '}
                      <span style={{ color: '#4f8ef7' }}>validados por não QA</span>
                    </div>
                  </div>
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: pctColor(topic.pct), cursor: 'default' }}>{topic.pct}%</span>
              </div>

              <div style={{ width: '60px', flexShrink: 0, textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#555' }}>{topic.validated}/{topic.total}</span>
              </div>
            </div>
            {idx < topics.length - 1 && <div style={{ height: '1px', background: '#232323', margin: '0 24px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
