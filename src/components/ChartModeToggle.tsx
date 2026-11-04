'use client';

import type { ChartMode } from '@/components/MonthlyChart';

const DEFAULT_OPTIONS: { label: string; value: ChartMode }[] = [
  { label: 'Linhas', value: 'line' },
  { label: 'Barras', value: 'bar' },
];

export default function ChartModeToggle<M extends string = ChartMode>({
  mode,
  onChange,
  options = DEFAULT_OPTIONS as unknown as { label: string; value: M }[],
}: {
  mode: M;
  onChange: (m: M) => void;
  options?: { label: string; value: M }[];
}) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map((option) => {
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
