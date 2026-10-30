'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/paperclip', label: 'Agentes' },
  { href: '/paperclip/plano', label: 'Plano' },
  { href: '/paperclip/decisoes', label: 'Decisões' },
  { href: '/paperclip/prompts', label: 'Prompts' },
];

export default function SubTabs() {
  const pathname = usePathname();
  return (
    <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #2a2a2a', padding: '0 24px', height: '42px', background: '#0f0f0f' }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '14px', textDecoration: 'none', marginBottom: '-1px',
              color: active ? '#4f8ef7' : '#888', fontWeight: active ? 600 : 400,
              borderBottom: `2px solid ${active ? '#4f8ef7' : 'transparent'}`,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
