export interface LinearState {
  id: string;
  name: string;
  color: string;
  type: 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';
  position: number;
}

export interface LinearAssignee {
  id: string;
  name: string;
  avatarUrl?: string | null;
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
  assignee?: LinearAssignee | null;
  createdAt: string;
  completedAt?: string | null;
  canceledAt?: string | null;
  startedAt?: string | null;
}

export interface DayPoint {
  date: Date;
  dateLabel: string;   // "14/04"
  scoped: number;      // cumulative issues created on or before this day
  completed: number;   // cumulative issues completed on or before this day
  inProgress: number;  // issues started but not completed/cancelled on this day
  newScoped: number;   // issues created on exactly this day
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
  position: number;
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
