'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RequirementsList from '@/components/RequirementsList';
import type { DashboardData, LinearState } from '@/lib/types';

function LoadingSkeleton() {
  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar skeleton */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div
          className="animate-pulse"
          style={{ width: '220px', height: '32px', background: '#2a2a2a', borderRadius: '6px' }}
        />
        {[70, 60, 80, 65, 75, 55].map((w, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ width: `${w}px`, height: '26px', background: '#2a2a2a', borderRadius: '20px' }}
          />
        ))}
      </div>

      {/* Project section skeleton */}
      {[1, 2, 3].map((pidx) => (
        <div key={pidx}>
          <div
            style={{
              padding: '12px 24px',
              background: '#1f1f1f',
              borderTop: pidx > 1 ? '1px solid #2a2a2a' : 'none',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <div
              className="animate-pulse"
              style={{ width: '14px', height: '14px', background: '#2a2a2a', borderRadius: '3px' }}
            />
            <div
              className="animate-pulse"
              style={{ width: '180px', height: '13px', background: '#2a2a2a', borderRadius: '4px' }}
            />
            <div
              className="animate-pulse"
              style={{ width: '28px', height: '18px', background: '#2a2a2a', borderRadius: '10px', marginLeft: '4px' }}
            />
          </div>
          {/* Issue rows */}
          {Array.from({ length: pidx === 1 ? 4 : pidx === 2 ? 3 : 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 24px',
              }}
            >
              <div style={{ width: '16px' }} />
              <div
                className="animate-pulse"
                style={{ width: '60px', height: '11px', background: '#2a2a2a', borderRadius: '3px' }}
              />
              <div
                className="animate-pulse"
                style={{ flex: 1, height: '13px', background: '#2a2a2a', borderRadius: '4px', maxWidth: `${220 + i * 30}px` }}
              />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <div
                  className="animate-pulse"
                  style={{ width: '7px', height: '7px', background: '#2a2a2a', borderRadius: '50%' }}
                />
                <div
                  className="animate-pulse"
                  style={{ width: '55px', height: '11px', background: '#2a2a2a', borderRadius: '3px' }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const VALID_STATE_TYPES: LinearState['type'][] = [
  'triage', 'backlog', 'unstarted', 'started', 'completed', 'cancelled',
];

function isValidStateType(value: string | null): value is LinearState['type'] {
  return value !== null && (VALID_STATE_TYPES as string[]).includes(value);
}

function RequirementsPageInner() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const initialTypeFilter: LinearState['type'] | null = isValidStateType(typeParam) ? typeParam : null;
  const initialStateId = searchParams.get('stateId');
  const initialProjectId = searchParams.get('projectId');

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/linear');
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: '#e5e5e5',
            letterSpacing: '-0.02em',
          }}
        >
          Requirements
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Hierarchical view of all project requirements from Linear
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: '#2a1515',
            border: '1px solid #5a2020',
            borderRadius: '8px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
          <button
            onClick={fetchData}
            style={{
              background: '#3a2020',
              border: '1px solid #5a2020',
              borderRadius: '5px',
              padding: '5px 12px',
              fontSize: '12px',
              color: '#f87171',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Initial loading skeleton */}
      {initialLoad && <LoadingSkeleton />}

      {/* Requirements list */}
      {!initialLoad && data && (
        <RequirementsList
          data={data}
          loading={loading}
          initialTypeFilter={initialTypeFilter}
          initialStateId={initialStateId}
          initialProjectId={initialProjectId}
        />
      )}

      {/* Empty state */}
      {!initialLoad && !data && !error && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: '#555',
            fontSize: '14px',
          }}
        >
          No data available.
        </div>
      )}
    </div>
  );
}

export default function RequirementsPage() {
  return (
    <Suspense fallback={null}>
      <RequirementsPageInner />
    </Suspense>
  );
}
