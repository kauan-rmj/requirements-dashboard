'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useV3 } from './V3Provider';

const TABS = [
  { href: '/v3', label: 'Dashboard' },
  { href: '/v3/tabela', label: 'Tabela' },
  { href: '/v3/issues', label: 'Issues' },
];

export default function V3Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { error } = useV3();
  const wide = pathname.startsWith('/v3/tabela');

  return (
    <div style={{ maxWidth: wide ? 'none' : '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#e5e5e5', letterSpacing: '-0.02em' }}>V3</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Testes de tela das funcionalidades do projeto V3 · garantir ausência de bugs e facilidade de uso
        </p>
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #2a2a2a', marginBottom: '24px' }}>
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: '8px 16px', fontSize: '14px', textDecoration: 'none', marginBottom: '-1px',
                color: active ? '#4f8ef7' : '#888', fontWeight: active ? 600 : 400,
                borderBottom: `2px solid ${active ? '#4f8ef7' : 'transparent'}`,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {children}
    </div>
  );
}
