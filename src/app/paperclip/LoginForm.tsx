'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from './actions';

const FAIL = 'E-mail ou senha inválidos.';

const field = {
  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3a3a3a',
  background: '#1a1a1a', color: '#e5e5e5', fontSize: '14px', outline: 'none',
} as const;

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const result = await login(String(data.get('email') ?? ''), String(data.get('password') ?? ''));
      if (result.ok) {
        router.refresh();
        return;
      }
      setError(FAIL);
    } catch {
      setError(FAIL);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 24px' }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: '340px', display: 'grid', gap: '12px' }}>
        <input name="email" type="email" placeholder="E-mail" autoComplete="username" required style={field} />
        <input name="password" type="password" placeholder="Senha" autoComplete="current-password" required style={field} />
        {error && <div role="alert" style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>}
        <button
          type="submit"
          disabled={busy}
          style={{ padding: '10px', borderRadius: '8px', border: 0, background: '#4f8ef7', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
