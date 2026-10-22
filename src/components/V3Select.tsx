'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface V3SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: ReactNode;
}

interface V3SelectProps {
  value: string;
  options: V3SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  color?: string; // text + border color of the trigger (and menu)
  bold?: boolean;
  background?: string;
  padding?: string;
  bare?: boolean; // trigger is just the selected icon (no border/background/chevron); the menu opens on click
  iconOnly?: boolean; // trigger shows only the selected option's icon (label as hover title)
}

const RADIUS = '6px';

export default function V3Select({ value, options, onChange, placeholder = 'Selecione…', color, bold, background = '#242424', padding = '6px 8px', iconOnly, bare }: V3SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = value ? options.find((o) => o.value === value) : undefined;
  const border = color ?? '#3a3a3a';

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

  const trigger = bare ? (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-haspopup="listbox"
      aria-expanded={open}
      style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', outline: 'none', borderRadius: '50%' }}
    >
      {selected?.icon ?? (
        <span style={{ width: 20, height: 20, borderRadius: '50%', border: '1px dashed #555', display: 'block' }} />
      )}
    </button>
  ) : null;

  return (
    <>
      {trigger}
      {!bare && <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
          background, border: `1px solid ${border}`, borderRadius: RADIUS, padding,
          color: color ?? (selected ? '#e5e5e5' : '#666'), fontSize: '13px', fontWeight: bold ? 600 : 400,
          fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', outline: 'none',
        }}
      >
        {iconOnly && selected?.icon ? (
          selected.icon
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            {selected?.icon}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected?.label ?? placeholder}</span>
          </span>
        )}
        <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
      </button>}
      {open && rect && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed', left: rect.left, top: rect.top, width: iconOnly || bare ? undefined : rect.width, minWidth: iconOnly || bare ? 220 : undefined, zIndex: 300,
            background: '#242424', border: `1px solid ${border}`, borderRadius: RADIUS, padding: '4px',
            maxHeight: '260px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <div
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false); }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#2f2f2f')}
                onMouseLeave={(e) => (e.currentTarget.style.background = active ? '#2a2a2a' : 'transparent')}
                style={{
                  padding: '6px 8px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
                  color: o.color ?? '#e5e5e5', fontWeight: active ? 600 : 400, background: active ? '#2a2a2a' : 'transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {o.icon}
                  {o.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
