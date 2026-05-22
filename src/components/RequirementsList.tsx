'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import type { DashboardData, IssueNode, LinearState } from '@/lib/types';

interface RequirementsListProps {
  data: DashboardData;
  loading: boolean;
}

type CollapsedSet = Set<string>;

const STATE_TYPE_LABELS: Record<LinearState['type'], string> = {
  triage: 'Triage',
  backlog: 'Backlog',
  unstarted: 'Unstarted',
  started: 'Started',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATE_TYPE_ORDER: LinearState['type'][] = [
  'triage',
  'backlog',
  'unstarted',
  'started',
  'completed',
  'cancelled',
];

function matchesSearch(node: IssueNode, query: string): boolean {
  const q = query.toLowerCase();
  if (node.identifier.toLowerCase().includes(q)) return true;
  if (node.title.toLowerCase().includes(q)) return true;
  return node.childNodes.some((child) => matchesSearch(child, q));
}

function filterNode(node: IssueNode, query: string, typeFilter: LinearState['type'] | null): IssueNode | null {
  const filteredChildren = node.childNodes
    .map((child) => filterNode(child, query, typeFilter))
    .filter((c): c is IssueNode => c !== null);

  const selfMatchesSearch = query === '' || node.identifier.toLowerCase().includes(query.toLowerCase()) || node.title.toLowerCase().includes(query.toLowerCase());
  const selfMatchesType = typeFilter === null || node.state.type === typeFilter;
  const selfMatches = selfMatchesSearch && selfMatchesType;

  if (selfMatches || filteredChildren.length > 0) {
    return { ...node, childNodes: filteredChildren.length > 0 ? filteredChildren : (selfMatches ? node.childNodes : []) };
  }

  return null;
}

interface IssueRowProps {
  node: IssueNode;
  depth: number;
  collapsed: CollapsedSet;
  onToggle: (id: string) => void;
}

function IssueRow({ node, depth, collapsed, onToggle }: IssueRowProps) {
  const hasChildren = node.childNodes.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const indent = depth * 16;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 16px 7px 0',
          paddingLeft: `${16 + indent}px`,
          borderRadius: '4px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'background 100ms ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#232323';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {/* Expand/collapse chevron */}
        <div style={{ width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {hasChildren ? (
            isCollapsed ? (
              <ChevronRight size={13} style={{ color: '#555' }} />
            ) : (
              <ChevronDown size={13} style={{ color: '#555' }} />
            )
          ) : null}
        </div>

        {/* Identifier */}
        <span
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '11px',
            color: '#555',
            flexShrink: 0,
            minWidth: '68px',
          }}
        >
          {node.identifier}
        </span>

        {/* Title */}
        <span
          style={{
            fontSize: '13px',
            color: '#ccc',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={node.title}
        >
          {node.title}
        </span>

        {/* Status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: node.state.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: '#666',
              whiteSpace: 'nowrap',
            }}
          >
            {node.state.name}
          </span>
        </div>
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <>
          {node.childNodes.map((child) => (
            <IssueRow
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </>
      )}
    </>
  );
}

export default function RequirementsList({ data, loading }: RequirementsListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<LinearState['type'] | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [collapsedIssues, setCollapsedIssues] = useState<Set<string>>(() => {
    // Start with all depth-1+ nodes collapsed (just root nodes expanded)
    return new Set<string>();
  });

  // Collect all unique state types across all issues
  const allStateTypes = useMemo(() => {
    const types = new Map<LinearState['type'], { color: string; name: string }>();
    for (const project of data.projects) {
      for (const issue of project.allIssues) {
        if (!types.has(issue.state.type)) {
          types.set(issue.state.type, { color: issue.state.color, name: issue.state.name });
        }
      }
    }
    return STATE_TYPE_ORDER.filter((t) => types.has(t)).map((t) => ({
      type: t,
      ...types.get(t)!,
    }));
  }, [data]);

  const filteredProjects = useMemo(() => {
    return data.projects
      .map((project) => {
        const filteredRoots = project.rootIssues
          .map((node) => filterNode(node, search, typeFilter))
          .filter((n): n is IssueNode => n !== null);

        return { ...project, rootIssues: filteredRoots };
      })
      .filter((p) => p.rootIssues.length > 0);
  }, [data, search, typeFilter]);

  const toggleProject = (id: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleIssue = (id: string) => {
    setCollapsedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasResults = filteredProjects.length > 0;

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
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
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
            placeholder="Search requirements..."
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
              width: '220px',
              transition: 'border-color 150ms ease',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#4f8ef7';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#3a3a3a';
            }}
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

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#555' }}>Filter:</span>
          {allStateTypes.map((st) => {
            const isActive = typeFilter === st.type;
            return (
              <button
                key={st.type}
                onClick={() => setTypeFilter(isActive ? null : st.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${isActive ? st.color : '#3a3a3a'}`,
                  background: isActive ? `${st.color}22` : 'transparent',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: isActive ? st.color : '#888',
                  transition: 'all 150ms ease',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: st.color,
                  }}
                />
                {STATE_TYPE_LABELS[st.type]}
              </button>
            );
          })}
          {(typeFilter || search) && (
            <button
              onClick={() => { setTypeFilter(null); setSearch(''); }}
              style={{
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid #3a3a3a',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#666',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {loading && (
          <span style={{ fontSize: '12px', color: '#555', marginLeft: 'auto' }}>
            Refreshing...
          </span>
        )}
      </div>

      {/* Content */}
      <div>
        {!hasResults && (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: '#555',
              fontSize: '14px',
            }}
          >
            {data.projects.length === 0
              ? 'No projects found. Check your LINEAR_API_KEY configuration.'
              : 'No requirements match your filter.'}
          </div>
        )}

        {filteredProjects.map((project, pidx) => {
          const isProjectCollapsed = collapsedProjects.has(project.id);

          return (
            <div key={project.id}>
              {/* Project header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#1f1f1f',
                  borderTop: pidx > 0 ? '1px solid #2a2a2a' : 'none',
                  cursor: 'pointer',
                  transition: 'background 100ms ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = '#252525';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = '#1f1f1f';
                }}
                onClick={() => toggleProject(project.id)}
              >
                {isProjectCollapsed ? (
                  <ChevronRight size={14} style={{ color: '#555', flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={14} style={{ color: '#555', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e5e5e5',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {project.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#555',
                    background: '#2a2a2a',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    marginLeft: '4px',
                  }}
                >
                  {project.rootIssues.length}
                </span>
              </div>

              {/* Issues */}
              {!isProjectCollapsed && (
                <div style={{ padding: '4px 8px 8px' }}>
                  {project.rootIssues.length === 0 && (
                    <div
                      style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: '#555',
                      }}
                    >
                      No issues in this project.
                    </div>
                  )}
                  {project.rootIssues.map((node) => (
                    <IssueRow
                      key={node.id}
                      node={node}
                      depth={0}
                      collapsed={collapsedIssues}
                      onToggle={toggleIssue}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
