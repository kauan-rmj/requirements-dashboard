'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import V3Avatar from '@/components/V3Avatar';
import type { V3Milestone, V3Priority, V3Status, V3Test, V3User } from '@/lib/v3-tests';

export type Draft = {
  milestone: string;
  feature: string;
  assigneeId: string;
  validatorId: string;
  priority: V3Priority;
  status: V3Status;
  test: string;
};

export const EMPTY_DRAFT: Draft = {
  milestone: '', feature: '', assigneeId: '', validatorId: '', priority: 'sem_prioridade', status: 'validacao_pendente', test: '',
};

interface V3Context {
  tests: V3Test[];
  loading: boolean;
  error: string | null;
  milestones: V3Milestone[];
  users: V3User[];
  save: (id: number, patch: Partial<V3Test>, debounce?: number) => void;
  create: (draft: Draft) => Promise<void>;
  remove: (id: number) => Promise<void>;
  userOptions: (emptyLabel: string, only?: string[], current?: string | null) => { value: string; label: string; icon?: ReactNode }[];
}

const Ctx = createContext<V3Context | null>(null);

export function useV3(): V3Context {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useV3 must be used inside V3Provider');
  return ctx;
}

export default function V3Provider({ children }: { children: ReactNode }) {
  const [tests, setTests] = useState<V3Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<V3Milestone[]>([]);
  const [users, setUsers] = useState<V3User[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/v3-tests', { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setTests(j.tests);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/v3-milestones', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setMilestones(j.milestones ?? []))
      .catch(() => setError('Falha ao carregar milestones do Linear'));
    fetch('/api/v3-users', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setUsers(j.users ?? []))
      .catch(() => setError('Falha ao carregar usuários do Linear'));
  }, [load]);

  const save = useCallback((id: number, patch: Partial<V3Test>, debounce = 0) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const key = `${id}:${Object.keys(patch)[0]}`;
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v3-tests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
        if (!res.ok) throw new Error();
      } catch {
        setError('Falha ao salvar alteração');
      }
    }, debounce);
  }, []);

  const create = useCallback(async (draft: Draft) => {
    const res = await fetch('/api/v3-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error);
    setTests((prev) => [...prev, j.test]);
    setError(null);
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/v3-tests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTests((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Falha ao excluir teste. Verifique a conexão com o servidor e tente novamente.');
    }
  }, []);

  // `current` stays selectable even when outside `only` (e.g. an assignee set in Linear).
  const userOptions: V3Context['userOptions'] = (emptyLabel, only, current) => [
    { value: '', label: emptyLabel },
    ...users
      .filter((u) => !only || only.includes(u.id) || u.id === current)
      .map((u) => ({ value: u.id, label: u.name, icon: <V3Avatar name={u.name} avatarUrl={u.avatarUrl} size={20} tooltip={false} /> })),
  ];

  return (
    <Ctx.Provider value={{ tests, loading, error, milestones, users, save, create, remove, userOptions }}>
      {children}
    </Ctx.Provider>
  );
}
