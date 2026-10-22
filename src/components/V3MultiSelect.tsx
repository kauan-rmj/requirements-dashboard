'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface V3MultiOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  values: string[];
  options: V3MultiOption[];
  onChange: (values: string[]) => void;
  emptyLabel?: string;
  bare?: boolean; // trigger is just the stacked icons (table cell); otherwise a bordered field
  background?: string;
  padding?: string;
}

// Multi-select with a checkbox menu that stays open while toggling; same look as V3Select.
export default function V3MultiSelect({ values, options, onChange, emptyLabel = 'Nenhum', bare, background = '#242424', padding = '6px 8px' }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.filter((o) => values.includes(o.value));

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom + 4, width: r.width });
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === 'mousedown' && (btnRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node))) return;
      if (e.type === 'scroll' && menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const flip = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  const icons = selected.length ? (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      {selected.map((o, i) => (
        <span key={o.value} title={o.label} style={{ display: 'flex', marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px #1a1a1a' }}>{o.icon}</span>
      ))}
    </span>
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={bare
          ? { background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', outline: 'none', borderRadius: '12px' }
          : { width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background, border: '1px solid #3a3a3a', borderRadius: '6px', padding, color: selected.length ? '#e5e5e5' : '#666', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', outline: 'none', minHeight: 20 }}
      >
        {icons ?? (bare
          ? <span style={{ width: 28, height: 28, borderRadius: '50%', border: '1px dashed #555', display: 'block' }} />
          : null)}
        {!bare && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.length ? selected.map((o) => o.label).join(', ') : emptyLabel}</span>}
      </button>
      {open && rect && (
        <div
          ref={menuRef}
          role="listbox"
          aria-multiselectable
          style={{
            position: 'fixed', left: rect.left, top: rect.top, width: bare ? undefined : rect.width, minWidth: bare ? 220 : undefined, zIndex: 300,
            background: '#242424', border: '1px solid #3a3a3a', borderRadius: '6px', padding: '4px',
            maxHeight: '260px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {options.map((o) => {
            const active = values.includes(o.value);
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => flip(o.value)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2f2f2f')}
                onMouseLeave={(e) => (e.currentTarget.style.background = active ? '#2a2a2a' : 'transparent')}
                style={{ padding: '6px 8px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', color: '#e5e5e5', fontWeight: active ? 600 : 400, background: active ? '#2a2a2a' : 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {o.icon}
                  <span style={{ flex: 1 }}>{o.label}</span>
                  {active && <Check size={14} color="#4f8ef7" />}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
