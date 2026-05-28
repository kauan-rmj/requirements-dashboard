'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import type { DashboardData, IssueNode, LinearState } from '@/lib/types';

interface RequirementsListProps {
  data: DashboardData;
  loading: boolean;
  initialTypeFilter?: LinearState['type'] | null;
}

type CollapsedSet = Set<string>;

const PRIORITY_LEVELS = [
  { value: 1, label: 'Urgent',      color: '#ef4444' },
  { value: 2, label: 'High',        color: '#f87171' },
  { value: 3, label: 'Medium',      color: '#fca5a5' },
  { value: 4, label: 'Low',         color: '#cccccc' },
  { value: 0, label: 'No priority', color: '#6b7280' },
] as const;

const PRIORITY_COLOR: Record<number, string> = Object.fromEntries(
  PRIORITY_LEVELS.map((p) => [p.value, p.color]),
);

function priorityColor(priority: number): string {
  return PRIORITY_COLOR[priority] ?? '#6b7280';
}

const TYPE_ORDER: Record<string, number> = {
  triage: 0,
  backlog: 1,
  unstarted: 2,
  started: 3,
  completed: 4,
  cancelled: 5,
};

// ---------- MultiSelect ----------

interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  placeholder: string;
  options: MultiSelectOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

function MultiSelect({ placeholder, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpen((o) => !o);
  };

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  const buttonLabel =
    selected.size === 0
      ? placeholder
      : selected.size === 1
        ? (options.find((o) => selected.has(o.value))?.label ?? placeholder)
        : `${selected.size} selected`;

  const isActive = selected.size > 0;

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        background: '#1f1f1f',
        border: '1px solid #3a3a3a',
        borderRadius: '6px',
        zIndex: 9999,
        minWidth: '190px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const checked = selected.has(opt.value);
        return (
          <div
            key={opt.value}
            onClick={() => toggle(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              background: checked ? '#252525' : 'transparent',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = '#2a2a2a')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = checked ? '#252525' : 'transparent')
            }
          >
            <div
              style={{
                width: '13px',
                height: '13px',
                borderRadius: '3px',
                border: `1px solid ${checked ? '#4f8ef7' : '#444'}`,
                background: checked ? '#4f8ef7' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked && (
                <span style={{ fontSize: '9px', color: '#fff', lineHeight: 1 }}>✓</span>
              )}
            </div>
            {opt.color && (
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: opt.color,
                  flexShrink: 0,
                }}
              />
            )}
            <span style={{ fontSize: '12px', color: '#ccc' }}>{opt.label}</span>
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        style={{
          background: '#2a2a2a',
          border: `1px solid ${isActive ? '#4f8ef7' : '#3a3a3a'}`,
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '12px',
          color: isActive ? '#e5e5e5' : '#666',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
          transition: 'border-color 150ms ease',
        }}
      >
        {buttonLabel}
        <ChevronDown size={11} style={{ color: '#555', flexShrink: 0 }} />
      </button>
      {typeof document !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

// ---------- Filter ----------

function filterNode(
  node: IssueNode,
  query: string,
  statusFilter: Set<string>,
  assigneeFilter: Set<string>,
  priorityFilter: Set<string>,
): IssueNode | null {
  const filteredChildren = node.childNodes
    .map((child) => filterNode(child, query, statusFilter, assigneeFilter, priorityFilter))
    .filter((c): c is IssueNode => c !== null);

  const selfMatchesSearch =
    query === '' ||
    node.identifier.toLowerCase().includes(query.toLowerCase()) ||
    node.title.toLowerCase().includes(query.toLowerCase());
  const selfMatchesStatus = statusFilter.size === 0 || statusFilter.has(node.state.id);
  const selfMatchesAssignee =
    assigneeFilter.size === 0 || (node.assignee != null && assigneeFilter.has(node.assignee.id));
  const selfMatchesPriority =
    priorityFilter.size === 0 || priorityFilter.has(String(node.priority));
  const selfMatches = selfMatchesSearch && selfMatchesStatus && selfMatchesAssignee && selfMatchesPriority;

  if (selfMatches || filteredChildren.length > 0) {
    return {
      ...node,
      childNodes: filteredChildren.length > 0 ? filteredChildren : selfMatches ? node.childNodes : [],
    };
  }

  return null;
}

// ---------- IssueRow ----------

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
          cursor: node.url ? 'pointer' : 'default',
          transition: 'background 100ms ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#232323')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
        onClick={() => node.url && window.open(node.url, '_blank', 'noopener,noreferrer')}
      >
        {/* Expand/collapse chevron */}
        <div
          style={{ width: '16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          onClick={
            hasChildren
              ? (e) => {
                  e.stopPropagation();
                  onToggle(node.id);
                }
              : undefined
          }
        >
          {hasChildren &&
            (isCollapsed ? (
              <ChevronRight size={13} style={{ color: '#555' }} />
            ) : (
              <ChevronDown size={13} style={{ color: '#555' }} />
            ))}
        </div>

        {/* Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
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
          <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
            {node.state.name}
          </span>
        </div>

        {/* Title */}
        <span
          style={{
            fontSize: '13px',
            color: priorityColor(node.priority),
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={node.title}
        >
          {node.title}
        </span>

        {/* Assignee */}
        {node.assignee && (
          <span
            style={{
              fontSize: '11px',
              color: '#555',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}
          >
            {node.assignee.name}
          </span>
        )}
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

// ---------- Main component ----------

export default function RequirementsList({ data, loading, initialTypeFilter }: RequirementsListProps) {
  const [search, setSearch] = useState('');

  // Collect unique statuses sorted by type order then name
  const allStatuses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: string; type: string }>();
    for (const project of data.projects) {
      for (const issue of project.allIssues) {
        if (!map.has(issue.state.id)) {
          map.set(issue.state.id, {
            id: issue.state.id,
            name: issue.state.name,
            color: issue.state.color,
            type: issue.state.type,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const tDiff = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
      return tDiff !== 0 ? tDiff : a.name.localeCompare(b.name);
    });
  }, [data]);

  const allAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const project of data.projects) {
      for (const issue of project.allIssues) {
        if (issue.assignee && !map.has(issue.assignee.id)) {
          map.set(issue.assignee.id, { id: issue.assignee.id, name: issue.assignee.name });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Pre-select status IDs matching the initial type filter (from URL ?type=...)
  const [statusFilter, setStatusFilter] = useState<Set<string>>(() => {
    if (!initialTypeFilter) return new Set();
    const ids = new Set<string>();
    for (const project of data.projects) {
      for (const issue of project.allIssues) {
        if (issue.state.type === initialTypeFilter) ids.add(issue.state.id);
      }
    }
    return ids;
  });

  const [assigneeFilter, setAssigneeFilter] = useState<Set<string>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<string>>(new Set());

  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(
    () => new Set(data.projects.map((p) => p.id)),
  );
  const [collapsedIssues, setCollapsedIssues] = useState<Set<string>>(new Set());

  const filteredProjects = useMemo(() => {
    return data.projects
      .map((project) => {
        const filteredRoots = project.rootIssues
          .map((node) => filterNode(node, search, statusFilter, assigneeFilter, priorityFilter))
          .filter((n): n is IssueNode => n !== null);
        return { ...project, rootIssues: filteredRoots };
      })
      .filter((p) => p.rootIssues.length > 0);
  }, [data, search, statusFilter, assigneeFilter, priorityFilter]);

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

  const hasActiveFilters =
    search !== '' || statusFilter.size > 0 || assigneeFilter.size > 0 || priorityFilter.size > 0;
  const hasResults = filteredProjects.length > 0;

  const statusOptions: MultiSelectOption[] = allStatuses.map((s) => ({
    value: s.id,
    label: s.name,
    color: s.color,
  }));

  const assigneeOptions: MultiSelectOption[] = allAssignees.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const priorityOptions: MultiSelectOption[] = PRIORITY_LEVELS.map((p) => ({
    value: String(p.value),
    label: p.label,
    color: p.color,
  }));

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
          gap: '10px',
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

        {/* Status multi-select */}
        {statusOptions.length > 0 && (
          <MultiSelect
            placeholder="All statuses"
            options={statusOptions}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
        )}

        {/* Assignee multi-select */}
        {assigneeOptions.length > 0 && (
          <MultiSelect
            placeholder="All assignees"
            options={assigneeOptions}
            selected={assigneeFilter}
            onChange={setAssigneeFilter}
          />
        )}

        {/* Priority multi-select */}
        <MultiSelect
          placeholder="All priorities"
          options={priorityOptions}
          selected={priorityFilter}
          onChange={setPriorityFilter}
        />

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter(new Set());
              setAssigneeFilter(new Set());
              setPriorityFilter(new Set());
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #3a3a3a',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <X size={11} />
            Clear
          </button>
        )}

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
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = '#252525')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = '#1f1f1f')
                }
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
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#555' }}>
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
