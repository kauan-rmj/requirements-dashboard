export interface LinearState {
  id: string;
  name: string;
  color: string;
  type: 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  priority: number;
  description?: string | null;
  url?: string;
  state: LinearState;
  parent?: { id: string } | null;
}

export interface IssueNode extends LinearIssue {
  childNodes: IssueNode[];
}

export interface StatusCount {
  count: number;
  color: string;
  name: string;
  type: LinearState['type'];
}

export interface ProjectData {
  id: string;
  name: string;
  rootIssues: IssueNode[];
  allIssues: LinearIssue[];
  statusCounts: Record<string, StatusCount>;
  total: number;
  completed: number;
  pct: number;
}

export interface DashboardData {
  projects: ProjectData[];
  updatedAt: string;
}
