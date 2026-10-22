'use client';

import { useState } from 'react';

const AVATAR_COLORS = ['#4f8ef7', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6'];

function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash * 31) + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// Same avatar as the dashboard's project lead: photo, falling back to colored initials; hover shows the name.
export default function V3Avatar({ name, avatarUrl, size = 20, tooltip = true }: { name: string; avatarUrl?: string | null; size?: number; tooltip?: boolean }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div title={tooltip ? name : undefined} style={{ flexShrink: 0 }}>
      {avatarUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} onError={() => setImgError(true)} style={{ width: size, height: size, borderRadius: '50%', display: 'block' }} />
      ) : (
        <div
          style={{
            width: size, height: size, borderRadius: '50%', background: avatarBg(name), display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: Math.round(size * 0.4), fontWeight: 700, color: '#fff', cursor: 'default', userSelect: 'none',
          }}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}
