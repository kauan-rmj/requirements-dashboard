'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardData, ProjectData } from '@/lib/types';
import ProjectTimelineChart from '@/components/ProjectTimelineChart';

function LoadingSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: '#2a2a2a',
        borderRadius: '10px',
        height: '400px',
        width: '100%',
      }}
    />
  );
}

const RANGE_OPTIONS: { label: string; value: number | null }[] = [
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: 'All', value: null },
];

export default function TimelinePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState<number | null>(90);

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
      if (json.projects.length > 0 && selectedProjectId === null) {
        setSelectedProjectId(json.projects[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProject: ProjectData | null =
    data?.projects.find((p) => p.id === selectedProjectId) ?? data?.projects[0] ?? null;

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      {/* Header */}
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
          Timeline
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#555' }}>
          Daily scope and completion progress
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

      {!initialLoad && data && selectedProject && (
        <>
          {/* Controls row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Project dropdown */}
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                color: '#e5e5e5',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {/* Range buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {RANGE_OPTIONS.map((option) => {
                const isActive = daysBack === option.value;
                return (
                  <button
                    key={option.label}
                    onClick={() => setDaysBack(option.value)}
                    style={{
                      background: isActive ? '#1a2a4a' : 'transparent',
                      border: isActive ? '1px solid #4f8ef7' : '1px solid #3a3a3a',
                      color: isActive ? '#4f8ef7' : '#888',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 150ms ease',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart card */}
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid #3a3a3a',
              borderRadius: '10px',
              padding: '24px',
            }}
          >
            {loading && (
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                Refreshing...
              </div>
            )}
            <ProjectTimelineChart project={selectedProject} daysBack={daysBack} />
          </div>
        </>
      )}

      {/* Empty state after loading */}
      {!initialLoad && data && data.projects.length === 0 && (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            color: '#555',
            fontSize: '14px',
          }}
        >
          No projects available.
        </div>
      )}

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
