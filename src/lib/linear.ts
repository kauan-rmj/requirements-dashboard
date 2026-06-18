import type { DashboardData, DayPoint, IssueNode, LinearIssue, LinearState, ProjectData, StatusCount, TimelinePoint } from './types';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

const PROJECTS_LIST_QUERY = `
  query FetchProjects {
    projects(first: 50) {
      nodes {
        id
        name
        lead {
          id
          name
          avatarUrl
        }
        labels {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;

const ISSUES_QUERY = `
  query FetchIssues($projectId: String!) {
    project(id: $projectId) {
      issues(first: 250) {
        nodes {
          id
          identifier
          title
          priority
          description
          url
          createdAt
          completedAt
          canceledAt
          startedAt
          parent {
            id
          }
          assignee {
            id
            name
            avatarUrl
          }
          state {
            id
            name
            color
            type
            position
          }
          labels {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
`;

interface RawState {
  id: string;
  name: string;
  color: string;
  type: string;
  position: number;
}

interface RawIssue {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  description?: string | null;
  url?: string;
  createdAt: string;
  completedAt?: string | null;
  canceledAt?: string | null;
  startedAt?: string | null;
  parent?: { id: string } | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  state: RawState;
  labels: { nodes: { id: string; name: string }[] };
}

interface RawProjectSummary {
  id: string;
  name: string;
  lead?: { id: string; name: string; avatarUrl?: string | null } | null;
  labels: {
    nodes: { id: string; name: string }[];
  };
}

interface ProjectsListResponse {
  data?: {
    projects?: {
      nodes: RawProjectSummary[];
    };
  };
  errors?: { message: string }[];
}

interface IssuesResponse {
  data?: {
    project?: {
      issues: {
        nodes: RawIssue[];
      };
    };
  };
  errors?: { message: string }[];
}

async function gql<T>(apiKey: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey.replace(/^Bearer\s+/i, ''),
    },
    body: JSON.stringify({ query, variables }),
  } satisfies RequestInit);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Linear API ${response.status}: ${body || response.statusText}`);
  }

  const json = (await response.json()) as unknown as T & { errors?: { message: string }[] };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Linear GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  return json;
}

function isValidStateType(type: string): type is LinearState['type'] {
  return ['triage', 'backlog', 'unstarted', 'started', 'completed', 'cancelled'].includes(type);
}

function parseIssue(raw: RawIssue): LinearIssue {
  const stateType = isValidStateType(raw.state.type) ? raw.state.type : 'unstarted';
  return {
    id: raw.id,
    identifier: raw.identifier,
    title: raw.title,
    priority: raw.priority,
    description: raw.description ?? null,
    url: raw.url,
    state: {
      id: raw.state.id,
      name: raw.state.name,
      color: raw.state.color,
      type: stateType,
      position: raw.state.position,
    },
    parent: raw.parent ?? null,
    assignee: raw.assignee ?? null,
    createdAt: raw.createdAt,
    completedAt: raw.completedAt ?? null,
    canceledAt: raw.canceledAt ?? null,
    startedAt: raw.startedAt ?? null,
    labels: raw.labels.nodes,
  };
}

const ENV_LABELS = new Set(['hml', 'std']);

function isEffectivelyCompleted(issue: LinearIssue): boolean {
  if (issue.state.type === 'completed') return true;
  if (
    issue.state.name.toLowerCase() === 'ready' &&
    issue.labels.some((l) => ENV_LABELS.has(l.name.toLowerCase()))
  ) return true;
  return false;
}

function buildTree(issues: LinearIssue[]): IssueNode[] {
  const nodeMap = new Map<string, IssueNode>();

  for (const issue of issues) {
    nodeMap.set(issue.id, { ...issue, childNodes: [] });
  }

  const roots: IssueNode[] = [];

  for (const issue of issues) {
    const node = nodeMap.get(issue.id);
    if (!node) continue;

    if (issue.parent?.id) {
      const parent = nodeMap.get(issue.parent.id);
      if (parent) {
        parent.childNodes.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  const sortByPriority = (a: IssueNode, b: IssueNode) => {
    const pa = a.priority === 0 ? 99 : a.priority;
    const pb = b.priority === 0 ? 99 : b.priority;
    return pa - pb;
  };

  const sortRecursive = (nodes: IssueNode[]): IssueNode[] => {
    nodes.sort(sortByPriority);
    for (const node of nodes) {
      node.childNodes = sortRecursive(node.childNodes);
    }
    return nodes;
  };

  return sortRecursive(roots);
}

const STATE_COLOR_OVERRIDES: Record<string, string> = {
  'ready': '#a855f7',  // purple
  'doing': '#15803d',  // dark green
  'done':  '#22c55e',
};

function resolveStateColor(name: string, apiColor: string): string {
  return STATE_COLOR_OVERRIDES[name.toLowerCase()] ?? apiColor;
}

function computeStatusCounts(issues: LinearIssue[]): Record<string, StatusCount> {
  const counts: Record<string, StatusCount> = {};

  for (const issue of issues) {
    const { id, name, color, type, position } = issue.state;
    if (!counts[id]) {
      counts[id] = { count: 0, color: resolveStateColor(name, color), name, type, position };
    }
    counts[id].count += 1;
  }

  return counts;
}

export function computeDailyTimeline(issues: LinearIssue[], daysBack: number | null): DayPoint[] {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  let startDate: Date;
  if (daysBack === null) {
    if (issues.length === 0) {
      startDate = new Date(endOfToday);
      startDate.setDate(endOfToday.getDate() - 29);
    } else {
      const earliest = issues.reduce<Date>((min, issue) => {
        const d = new Date(issue.createdAt);
        return d < min ? d : min;
      }, new Date(issues[0].createdAt));
      startDate = new Date(earliest);
      startDate.setHours(0, 0, 0, 0);
    }
  } else {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - (daysBack - 1));
    startDate.setHours(0, 0, 0, 0);
  }

  // Build daily points
  const dailyPoints: DayPoint[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endOfToday) {
    const startOfDay = new Date(cursor);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(cursor);
    endOfDay.setHours(23, 59, 59, 999);

    const dd = String(cursor.getDate()).padStart(2, '0');
    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
    const dateLabel = `${dd}/${mm}`;

    const scoped = issues.filter((issue) => new Date(issue.createdAt) <= endOfDay).length;
    const completed = issues.filter(
      (issue) => issue.completedAt != null && new Date(issue.completedAt) <= endOfDay,
    ).length;
    const inProgress = issues.filter((issue) => {
      if (issue.startedAt == null) return false;
      if (new Date(issue.startedAt) > endOfDay) return false;
      if (issue.completedAt != null && new Date(issue.completedAt) <= endOfDay) return false;
      if (issue.canceledAt != null && new Date(issue.canceledAt) <= endOfDay) return false;
      return true;
    }).length;
    const newScoped = issues.filter(
      (issue) => new Date(issue.createdAt) >= startOfDay && new Date(issue.createdAt) <= endOfDay,
    ).length;

    dailyPoints.push({
      date: new Date(cursor),
      dateLabel,
      scoped,
      completed,
      inProgress,
      newScoped,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  // Aggregate to weekly if range > 90 days
  if (dailyPoints.length > 90) {
    const weekMap = new Map<string, DayPoint>();

    for (const point of dailyPoints) {
      const d = new Date(point.date);
      // Get Sunday of the week containing this date
      const dayOfWeek = d.getDay(); // 0 = Sunday
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - dayOfWeek);
      sunday.setHours(0, 0, 0, 0);
      const key = sunday.toISOString().slice(0, 10);

      const existing = weekMap.get(key);
      if (!existing) {
        const dd = String(sunday.getDate()).padStart(2, '0');
        const mm = String(sunday.getMonth() + 1).padStart(2, '0');
        weekMap.set(key, {
          date: new Date(sunday),
          dateLabel: `${dd}/${mm}`,
          scoped: point.scoped,
          completed: point.completed,
          inProgress: point.inProgress,
          newScoped: point.newScoped,
        });
      } else {
        // For cumulative fields: take the latest (last point in the week wins)
        existing.scoped = point.scoped;
        existing.completed = point.completed;
        existing.inProgress = point.inProgress;
        // For daily sum: accumulate
        existing.newScoped += point.newScoped;
      }
    }

    return Array.from(weekMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return dailyPoints;
}

export function computeTimeline(projects: ProjectData[], weeks: number): TimelinePoint[] {
  // Generate `weeks` Sunday week-end dates going back from today
  const now = new Date();
  // Move to the most recent Sunday (or today if already Sunday)
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const mostRecentSunday = new Date(now);
  mostRecentSunday.setDate(now.getDate() - dayOfWeek);
  mostRecentSunday.setHours(23, 59, 59, 999);

  const weekEnds: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(mostRecentSunday);
    d.setDate(mostRecentSunday.getDate() - i * 7);
    weekEnds.push(d);
  }

  const points: TimelinePoint[] = weekEnds.map((weekEnd) => {
    const dd = String(weekEnd.getDate()).padStart(2, '0');
    const mm = String(weekEnd.getMonth() + 1).padStart(2, '0');
    const weekLabel = `${dd}/${mm}`;

    const projectPoints = projects.map((project) => {
      const total = project.allIssues.filter(
        (issue) => new Date(issue.createdAt) <= weekEnd,
      ).length;
      const completed = project.allIssues.filter(
        (issue) =>
          issue.completedAt != null && new Date(issue.completedAt) <= weekEnd,
      ).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { id: project.id, name: project.name, total, completed, pct };
    });

    return { weekLabel, weekEnd, projects: projectPoints };
  });

  return points;
}

export function formatUpdatedAt(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());
}

export async function fetchTargetProjects(apiKey: string): Promise<{ id: string; name: string }[]> {
  const projectsRes = await gql<ProjectsListResponse>(apiKey, PROJECTS_LIST_QUERY);
  const allProjects = projectsRes.data?.projects?.nodes ?? [];

  const trackingProjects = allProjects.filter((p) =>
    p.labels.nodes.some((l) => l.name === 'Tracking'),
  );

  const filterIds = process.env.LINEAR_PROJECT_IDS
    ? process.env.LINEAR_PROJECT_IDS.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const targets = filterIds
    ? trackingProjects.filter((p) => filterIds.includes(p.id))
    : trackingProjects;

  return targets.map((p) => ({ id: p.id, name: p.name, lead: p.lead ?? null }));
}

export async function fetchSingleProjectData(
  apiKey: string,
  p: { id: string; name: string; lead?: { id: string; name: string; avatarUrl?: string | null } | null },
): Promise<ProjectData> {
  const issuesRes = await gql<IssuesResponse>(apiKey, ISSUES_QUERY, { projectId: p.id });
  const rawIssues = issuesRes.data?.project?.issues.nodes ?? [];
  const EXCLUDED_STATE_NAMES = new Set(['canceled', 'cancelled', 'duplicate', 'impediment']);
  const allIssues = rawIssues.map(parseIssue).filter(
    (issue) =>
      issue.state.type !== 'cancelled' &&
      !EXCLUDED_STATE_NAMES.has(issue.state.name.toLowerCase()),
  );
  const rootIssues = buildTree(allIssues);
  const statusCounts = computeStatusCounts(allIssues);
  const total = allIssues.length;
  const completed = allIssues.filter(isEffectivelyCompleted).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { id: p.id, name: p.name, lead: p.lead ?? null, rootIssues, allIssues, statusCounts, total, completed, pct };
}

export async function fetchLinearData(apiKey: string): Promise<DashboardData> {
  const targetProjects = await fetchTargetProjects(apiKey);
  const projects = await Promise.all(targetProjects.map((p) => fetchSingleProjectData(apiKey, p)));
  const updatedAt = formatUpdatedAt();
  const timeline = computeTimeline(projects, 10);
  return { projects, updatedAt, timeline };
}
