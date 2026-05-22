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
  createdAt: string;
  completedAt?: string | null;
  canceledAt?: string | null;
}

export interface TimelinePoint {
  weekLabel: string;
  weekEnd: Date;
  projects: {
    id: string;
    name: string;
    total: number;
    completed: number;
    pct: number;
  }[];
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
  timeline: TimelinePoint[];
}
