import type { DashboardData, IssueNode, LinearIssue, LinearState, ProjectData, StatusCount } from './types';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';

const PROJECTS_QUERY = `
  query FetchProjects {
    projects(first: 50) {
      nodes {
        id
        name
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

interface RawProject {
  id: string;
  name: string;
  issues: {
    nodes: RawIssue[];
  };
}

interface GraphQLResponse {
  data?: {
    projects?: {
      nodes: RawProject[];
    };
  };
  errors?: { message: string }[];
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
        // Parent is in another project or missing — treat as root
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

function buildProjectData(raw: RawProject): ProjectData {
  const allIssues = raw.issues.nodes.map(parseIssue);
  const rootIssues = buildTree(allIssues);
  const statusCounts = computeStatusCounts(allIssues);
  const total = allIssues.length;
  const completed = allIssues.filter((i) => i.state.type === 'completed').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    id: raw.id,
    name: raw.name,
    rootIssues,
    allIssues,
    statusCounts,
    total,
    completed,
    pct,
  };
}

export async function fetchLinearData(apiKey: string): Promise<DashboardData> {
  const response = await fetch(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query: PROJECTS_QUERY }),
  } satisfies RequestInit);

  if (!response.ok) {
    throw new Error(`Linear API responded with ${response.status}: ${response.statusText}`);
  }

  // Cast through unknown for safe typing of unvalidated API response
  const json = (await response.json()) as unknown as GraphQLResponse;

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Linear GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  const rawProjects = json.data?.projects?.nodes ?? [];

  const filterIds = process.env.LINEAR_PROJECT_IDS
    ? process.env.LINEAR_PROJECT_IDS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const filteredProjects = filterIds
    ? rawProjects.filter((p) => filterIds.includes(p.id))
    : rawProjects;

  const projects = filteredProjects.map(buildProjectData);

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
