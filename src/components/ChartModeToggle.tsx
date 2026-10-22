'use client';

import type { ChartMode } from '@/components/MonthlyChart';

const OPTIONS: { label: string; value: ChartMode }[] = [
  { label: 'Linhas', value: 'line' },
  { label: 'Barras', value: 'bar' },
];

export default function ChartModeToggle({
  mode,
  onChange,
}: {
  mode: ChartMode;
  onChange: (m: ChartMode) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {OPTIONS.map((option) => {
        const isActive = mode === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              background: isActive ? '#1a2a4a' : 'transparent',
              border: isActive ? '1px solid #4f8ef7' : '1px solid #3a3a3a',
              color: isActive ? '#4f8ef7' : '#888',
              borderRadius: '6px',
              padding: '4px 10px',
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
  );
}
