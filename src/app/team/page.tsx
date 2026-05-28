'use client';

import { useState, useEffect, useCallback } from 'react';
import TeamView from '@/components/TeamView';
import type { DashboardData } from '@/lib/types';

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
          style={{ width: '260px', height: '32px', background: '#2a2a2a', borderRadius: '6px' }}
        />
      </div>
      <div
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: '#1f1f1f',
              border: '1px solid #2e2e2e',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid #282828',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <div
                className="animate-pulse"
                style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2a2a2a', flexShrink: 0 }}
              />
              <div
                className="animate-pulse"
                style={{ width: '120px', height: '13px', background: '#2a2a2a', borderRadius: '4px' }}
              />
            </div>
            <div style={{ padding: '10px 14px 14px' }}>
              {[80, 65, 90, 55].map((w, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <div
                    className="animate-pulse"
                    style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2a2a2a', flexShrink: 0 }}
                  />
                  <div
                    className="animate-pulse"
                    style={{ width: `${w}%`, height: '12px', background: '#2a2a2a', borderRadius: '3px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeamPage() {
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
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
          Team
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Current tasks and recently completed issues per assignee
        </p>
      </div>

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

      {initialLoad && <LoadingSkeleton />}

      {!initialLoad && data && <TeamView data={data} loading={loading} />}

      {!initialLoad && !data && !error && (
        <div style={{ padding: '48px', textAlign: 'center', color: '#555', fontSize: '14px' }}>
          No data available.
        </div>
      )}
    </div>
  );
}
