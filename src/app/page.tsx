'use client';

import { useState, useEffect, useCallback } from 'react';
import StatusChart from '@/components/StatusChart';
import TimelineChart from '@/components/TimelineChart';
import type { DashboardData } from '@/lib/types';

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 24px',
      }}
    >
      <div
        className="animate-pulse"
        style={{
          width: '200px',
          height: '14px',
          background: '#2a2a2a',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      />
      <div
        className="animate-pulse"
        style={{
          flex: 1,
          height: '28px',
          background: '#2a2a2a',
          borderRadius: '4px',
        }}
      />
      <div
        className="animate-pulse"
        style={{
          width: '44px',
          height: '14px',
          background: '#2a2a2a',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      />
      <div
        className="animate-pulse"
        style={{
          width: '60px',
          height: '12px',
          background: '#2a2a2a',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      />
    </div>
  );
}

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
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            className="animate-pulse"
            style={{ width: '220px', height: '16px', background: '#2a2a2a', borderRadius: '4px' }}
          />
          <div
            className="animate-pulse"
            style={{ width: '300px', height: '12px', background: '#2a2a2a', borderRadius: '4px' }}
          />
        </div>
        <div
          className="animate-pulse"
          style={{ width: '80px', height: '32px', background: '#2a2a2a', borderRadius: '6px' }}
        />
      </div>
      {/* Legend skeleton */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          gap: '16px',
        }}
      >
        {[80, 60, 90, 70, 55].map((w, i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ width: `${w}px`, height: '12px', background: '#2a2a2a', borderRadius: '4px' }}
          />
        ))}
      </div>
      {/* Row skeletons */}
      <div style={{ padding: '8px 0' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Module completion overview from Linear
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

      {/* Chart */}
      {!initialLoad && data && (
        <>
          <StatusChart data={data} onRefresh={fetchData} loading={loading} />
          <div style={{ marginTop: '24px' }}>
            <TimelineChart data={data.timeline} />
          </div>
        </>
      )}

      {/* Empty state after loading */}
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
