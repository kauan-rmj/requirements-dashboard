'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTree, BarChart2, TrendingUp } from 'lucide-react';

export default function NavBar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: BarChart2 },
    { href: '/requirements', label: 'Requirements', icon: ListTree },
    { href: '/timeline', label: 'Timeline', icon: TrendingUp },
  ];

  return (
    <nav
      style={{
        background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        height: '57px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <LayoutDashboard size={20} style={{ color: '#4f8ef7' }} />
        <span
          style={{
            color: '#e5e5e5',
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '-0.01em',
          }}
        >
          Requirements Dashboard
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#e5e5e5' : '#888888',
                background: isActive ? '#2a2a2a' : 'transparent',
                textDecoration: 'none',
                transition: 'color 150ms ease, background 150ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#e5e5e5';
                  (e.currentTarget as HTMLAnchorElement).style.background = '#232323';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLAnchorElement).style.color = '#888888';
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
