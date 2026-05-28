'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { DashboardData, LinearIssue } from '@/lib/types';

const PRIORITY_COLOR: Record<number, string> = {
  1: '#ef4444',
  2: '#f87171',
  3: '#fca5a5',
  4: '#cccccc',
  0: '#6b7280',
};

function priorityColor(p: number): string {
  return PRIORITY_COLOR[p] ?? '#6b7280';
}

const AVATAR_COLORS = ['#4f8ef7', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6'];

function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash * 31) + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

type IssueWithProject = LinearIssue & { projectName: string };

interface AssigneeData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  current: IssueWithProject[];
  recent: IssueWithProject[];
  totalIssues: number;
}

function buildAssigneeData(data: DashboardData): AssigneeData[] {
  const map = new Map<string, { id: string; name: string; avatarUrl?: string | null; issues: IssueWithProject[] }>();

  for (const project of data.projects) {
    for (const issue of project.allIssues) {
      if (!issue.assignee) continue;
      const { id, name, avatarUrl } = issue.assignee;
      if (!map.has(id)) map.set(id, { id, name, avatarUrl, issues: [] });
      map.get(id)!.issues.push({ ...issue, projectName: project.name });
    }
  }

  return Array.from(map.values())
    .map(({ id, name, avatarUrl, issues }) => {
      const current = issues.filter((i) => i.state.name === 'Doing');
      const recent = issues
        .filter((i) => i.state.name === 'Done' || i.state.name === 'Ready')
        .sort((a, b) => {
          const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return tb - ta;
        })
        .slice(0, 3);
      return { id, name, avatarUrl, current, recent, totalIssues: issues.length };
    })
    .sort((a, b) => b.totalIssues - a.totalIssues);
}

function IssueItem({ issue, dim }: { issue: IssueWithProject; dim?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '5px 6px',
        borderRadius: '4px',
        cursor: issue.url ? 'pointer' : 'default',
        opacity: dim ? 0.55 : 1,
        transition: 'background 100ms ease',
      }}
      onMouseEnter={(e) => issue.url && ((e.currentTarget as HTMLDivElement).style.background = '#252525')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
      onClick={() => issue.url && window.open(issue.url, '_blank', 'noopener,noreferrer')}
    >
      <div style={{ marginTop: '4px', flexShrink: 0 }}>
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: issue.state.color,
          }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '13px',
            color: priorityColor(issue.priority),
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={issue.title}
        >
          {issue.title}
        </div>
        <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '1px' }}>
          {issue.projectName}
        </div>
      </div>
    </div>
  );
}

function AssigneeCard({ assignee }: { assignee: AssigneeData }) {
  const bg = avatarBg(assignee.name);
  const hasActive = assignee.current.length > 0;

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #2e2e2e',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          background: '#1f1f1f',
          borderBottom: '1px solid #282828',
        }}
      >
        {assignee.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assignee.avatarUrl}
            alt={assignee.name}
            style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: bg,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {initials(assignee.name)}
          </div>
        )}
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5', letterSpacing: '-0.01em' }}>
          {assignee.name}
        </span>
        {hasActive && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 0 2px rgba(74,222,128,0.15)',
              }}
            />
            <span style={{ fontSize: '11px', color: '#4ade80' }}>Active</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 8px 12px' }}>
        {/* Current */}
        {hasActive && (
          <div style={{ marginBottom: assignee.recent.length > 0 ? '12px' : 0 }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#4a4a4a',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '0 6px',
                marginBottom: '4px',
              }}
            >
              Doing
            </div>
            {assignee.current.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        {/* Recent */}
        {assignee.recent.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#4a4a4a',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '0 6px',
                marginBottom: '4px',
              }}
            >
              Recently completed
            </div>
            {assignee.recent.map((issue) => (
              <IssueItem key={issue.id} issue={issue} dim />
            ))}
          </div>
        )}

        {!hasActive && assignee.recent.length === 0 && (
          <div style={{ padding: '8px 6px', fontSize: '12px', color: '#3a3a3a' }}>
            No active or recently completed tasks
          </div>
        )}
      </div>
    </div>
  );
}

interface TeamViewProps {
  data: DashboardData;
  loading: boolean;
}

export default function TeamView({ data, loading }: TeamViewProps) {
  const [search, setSearch] = useState('');
  const assignees = useMemo(() => buildAssigneeData(data), [data]);

  const filtered = useMemo(() => {
    if (!search) return assignees;
    const q = search.toLowerCase();
    return assignees.filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      return (
        a.current.some((i) => i.title.toLowerCase().includes(q)) ||
        a.recent.some((i) => i.title.toLowerCase().includes(q))
      );
    });
  }, [assignees, search]);

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#555',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search assignees or issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              padding: '6px 10px 6px 30px',
              fontSize: '13px',
              color: '#e5e5e5',
              outline: 'none',
              width: '260px',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = '#4f8ef7')}
            onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = '#3a3a3a')}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#555',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <span style={{ fontSize: '12px', color: '#555' }}>
          {filtered.length} assignee{filtered.length !== 1 ? 's' : ''}
        </span>

        {loading && (
          <span style={{ fontSize: '12px', color: '#555', marginLeft: 'auto' }}>
            Refreshing...
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '16px',
        }}
      >
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '48px',
              textAlign: 'center',
              color: '#555',
              fontSize: '14px',
            }}
          >
            {assignees.length === 0
              ? 'No assignees found with active or recent issues.'
              : 'No assignees match your search.'}
          </div>
        )}
        {filtered.map((a) => (
          <AssigneeCard key={a.id} assignee={a} />
        ))}
      </div>
    </div>
  );
}
