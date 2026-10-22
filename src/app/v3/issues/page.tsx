'use client';

import { useEffect, useState } from 'react';
import RequirementsList from '@/components/RequirementsList';
import type { ProjectData } from '@/lib/types';

export default function V3IssuesPage() {
  const [milestones, setMilestones] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v3-issues', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setMilestones(j.milestones);
      })
      .catch((e: Error) => setError(`Falha ao carregar issues do Linear: ${e.message}`))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#555', fontSize: '13px', padding: '24px 0' }}>Carregando…</div>;
  if (error) return <div style={{ color: '#f87171', fontSize: '13px' }}>{error}</div>;
  return <RequirementsList data={{ projects: milestones, updatedAt: '', timeline: [] }} loading={false} />;
}
