'use client';

import { useState } from 'react';
import { MONTH_COSTS, BILLING_PER_CONVERSATION } from '@/lib/costs';
import MonthlyChart, { type ChartMode } from '@/components/MonthlyChart';
import DualAxisChart from '@/components/DualAxisChart';
import ChartModeToggle from '@/components/ChartModeToggle';

const RANGE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '3M', value: 3 },
  { label: '6M', value: 6 },
  { label: 'All', value: null },
];

const usd = (v: number, d: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d });

type ChartKey = 'total' | 'perRequest' | 'perConversation' | 'responseTime';

const CHARTS: { key: Exclude<ChartKey, 'total'>; title: string; sub: string; color: string; tooltipLabel: string; axisFormat: (v: number) => string; valueFormat: (v: number) => string; accessor: (m: (typeof MONTH_COSTS)[number]) => number }[] = [
  {
    key: 'perRequest',
    title: 'Custo por requisição',
    sub: 'Custo total do mês ÷ requisições em request_control',
    color: '#22c55e',
    tooltipLabel: 'Custo / req.',
    axisFormat: (v: number) => usd(v, 4),
    valueFormat: (v: number) => usd(v, 4),
    accessor: (m: (typeof MONTH_COSTS)[number]) => m.cost / m.requests,
  },
  {
    key: 'perConversation',
    title: 'Custo por conversa',
    sub: 'Custo total do mês ÷ conversas válidas (sem teste/dev e deletadas)',
    color: '#4f8ef7',
    tooltipLabel: 'Custo / conv.',
    axisFormat: (v: number) => usd(v, 3),
    valueFormat: (v: number) => usd(v, 3),
    accessor: (m: (typeof MONTH_COSTS)[number]) => m.cost / m.conv,
  },
  {
    key: 'responseTime',
    title: 'Tempo de resposta médio',
    sub: 'Média de request_control.completion_time por mês, em segundos',
    color: '#f59e0b',
    tooltipLabel: 'Tempo médio',
    axisFormat: (v: number) => `${Math.round(v * 10) / 10} s`,
    valueFormat: (v: number) => `${v.toFixed(1)} s`,
    accessor: (m: (typeof MONTH_COSTS)[number]) => m.ctSum / m.ctCount / 1000,
  },
];

export default function CostsPage() {
  const [months, setMonths] = useState<number | null>(null);
  const [modes, setModes] = useState<Record<ChartKey, ChartMode>>({
    total: 'bar',
    perRequest: 'line',
    perConversation: 'line',
    responseTime: 'line',
  });
  const setMode = (k: ChartKey, m: ChartMode) => setModes((prev) => ({ ...prev, [k]: m }));
  const rows = months === null ? MONTH_COSTS : MONTH_COSTS.slice(-months);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.02em' }}>
          Costs
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Monthly platform cost efficiency · USD · Out/26* é parcial (01/10 a 21/10)
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {RANGE_OPTIONS.map((option) => {
            const isActive = months === option.value;
            return (
              <button
                key={option.label}
                onClick={() => setMonths(option.value)}
                style={{
                  background: isActive ? '#1a2a4a' : 'transparent',
                  border: isActive ? '1px solid #4f8ef7' : '1px solid #3a3a3a',
                  color: isActive ? '#4f8ef7' : '#888',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 150ms ease',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e5e5e5' }}>Custo, cobrança e conversas por mês</h2>
              <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#555' }}>
                Custo (soma de cost_control.cost) e cobrança estimada (conversas × $0,20 em média), USD, no eixo esquerdo. Conversas válidas, sem teste/dev e deletadas, no eixo direito.
              </p>
            </div>
            <ChartModeToggle mode={modes.total} onChange={(m) => setMode('total', m)} />
          </div>
          <DualAxisChart
            mode={modes.total}
            left={[
              {
                name: 'Custo total (USD)',
                color: '#22c55e',
                points: rows.map((m) => ({ label: m.label, value: m.cost, partial: m.partial })),
                axisFormat: (v) => usd(v, 0),
                valueFormat: (v) => usd(v, 0),
              },
              {
                name: 'Cobrança estimada (USD)',
                color: '#f59e0b',
                points: rows.map((m) => ({ label: m.label, value: m.conv * BILLING_PER_CONVERSATION, partial: m.partial })),
                axisFormat: (v) => usd(v, 0),
                valueFormat: (v) => usd(v, 0),
              },
            ]}
            right={{
              name: 'Conversas',
              color: '#4f8ef7',
              points: rows.map((m) => ({ label: m.label, value: m.conv, partial: m.partial })),
              axisFormat: (v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(Math.round(v))),
              valueFormat: (v) => Math.round(v).toLocaleString('en-US'),
            }}
          />
        </div>
        {CHARTS.map((c) => (
          <div
            key={c.title}
            style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '10px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e5e5e5' }}>{c.title}</h2>
                <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#555' }}>{c.sub}</p>
              </div>
              <ChartModeToggle mode={modes[c.key]} onChange={(m) => setMode(c.key, m)} />
            </div>
            <MonthlyChart
              mode={modes[c.key]}
              points={rows.map((m) => ({ label: m.label, value: c.accessor(m), partial: m.partial }))}
              color={c.color}
              tooltipLabel={c.tooltipLabel}
              axisFormat={c.axisFormat}
              valueFormat={c.valueFormat}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
