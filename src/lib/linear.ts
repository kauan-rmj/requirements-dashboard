import type { DashboardData, IssueNode, LinearIssue, LinearState, ProjectData, StatusCount } from './types';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

const PROJECTS_LIST_QUERY = `
  query FetchProjects {
    projects(first: 50) {
      nodes {
        id
        name
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
  query FetchIssues($projectId: ID!) {
    project(id: $projectId) {
      issues(first: 250) {
        nodes {
          id
          identifier
          title
          priority
          description
          url
          parent {
            id
          }
          state {
            id
            name
            color
            type
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
}

interface RawIssue {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  description?: string | null;
  url?: string;
  parent?: { id: string } | null;
  state: RawState;
}

interface RawProjectSummary {
  id: string;
  name: string;
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
    },
    parent: raw.parent ?? null,
  };
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

  const sortByIdentifier = (a: IssueNode, b: IssueNode) =>
    a.identifier.localeCompare(b.identifier, undefined, { numeric: true });

  const sortRecursive = (nodes: IssueNode[]): IssueNode[] => {
    nodes.sort(sortByIdentifier);
    for (const node of nodes) {
      node.childNodes = sortRecursive(node.childNodes);
    }
    return nodes;
  };

  return sortRecursive(roots);
}

function computeStatusCounts(issues: LinearIssue[]): Record<string, StatusCount> {
  const counts: Record<string, StatusCount> = {};

  for (const issue of issues) {
    const { id, name, color, type } = issue.state;
    if (!counts[id]) {
      counts[id] = { count: 0, color, name, type };
    }
    counts[id].count += 1;
  }

  return counts;
}

export async function fetchLinearData(apiKey: string): Promise<DashboardData> {
  // Query 1: fetch all projects with labels only (low complexity)
  const projectsRes = await gql<ProjectsListResponse>(apiKey, PROJECTS_LIST_QUERY);
  const allProjects = projectsRes.data?.projects?.nodes ?? [];

  const trackingProjects = allProjects.filter((p) =>
    p.labels.nodes.some((l) => l.name === 'Tracking'),
  );

  const filterIds = process.env.LINEAR_PROJECT_IDS
    ? process.env.LINEAR_PROJECT_IDS.split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const targetProjects = filterIds
    ? trackingProjects.filter((p) => filterIds.includes(p.id))
    : trackingProjects;

  // Query 2..N: fetch issues per project individually (each query stays within complexity limit)
  const projects: ProjectData[] = await Promise.all(
    targetProjects.map(async (p) => {
      const issuesRes = await gql<IssuesResponse>(apiKey, ISSUES_QUERY, { projectId: p.id });
      const rawIssues = issuesRes.data?.project?.issues.nodes ?? [];
      const allIssues = rawIssues.map(parseIssue);
      const rootIssues = buildTree(allIssues);
      const statusCounts = computeStatusCounts(allIssues);
      const total = allIssues.length;
      const completed = allIssues.filter((i) => i.state.type === 'completed').length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { id: p.id, name: p.name, rootIssues, allIssues, statusCounts, total, completed, pct };
    }),
  );

  const updatedAt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date());

  return { projects, updatedAt };
}
