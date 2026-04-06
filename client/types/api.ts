export type UserPublic = {
  id: string;
  email: string;
  name: string;
  username: string;
  image: string | null;
  createdAt?: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId?: string;
  creator?: UserPublic;
  projectTeams?: { team: { id: string; name: string } }[];
  _count?: { tasks: number };
};

export type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  position: number;
  projectId: string;
  assigneeId: string | null;
  creatorId: string;
  blockedById: string | null;
  assignee?: UserPublic | null;
  creator?: UserPublic;
  blockedBy?: { id: string; title: string; status: string; priority?: string } | null;
  subTasks?: { id: string; title: string; completed: boolean; position: number }[];
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    user: UserPublic;
  }[];
  attachments?: { id: string; filename: string; url: string; mimeType: string | null; size: number | null }[];
  project?: { id: string; name: string };
};

export type ProjectDetail = ProjectSummary & {
  tasks: TaskDetail[];
  creator?: UserPublic;
};

export type TeamSummary = {
  id: string;
  name: string;
  description: string | null;
  members?: {
    id: string;
    role: string;
    user: UserPublic;
  }[];
};

export type TeamDetail = TeamSummary & {
  projectTeams?: { project: ProjectSummary }[];
};

export type ActivityItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: unknown;
  user: UserPublic;
  task?: { id: string; title: string; status: string } | null;
  project?: { id: string; name: string } | null;
};

export type MyWorkResponse = {
  overdue: TaskDetail[];
  dueToday: TaskDetail[];
  dueThisWeek: TaskDetail[];
  recentlyCompleted: TaskDetail[];
  priorityBuckets: Record<string, TaskDetail[]>;
};

export type HeatmapResponse = {
  start: string;
  days: number;
  cells: { date: string; userId: string; count: number }[];
  users: UserPublic[];
};

export type BurndownResponse = {
  series: { week: string; urgent: number; high: number }[];
};

export type SearchResponse = {
  projects: { id: string; name: string; status: string; priority: string; updatedAt: string }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectId: string;
    project: { id: string; name: string };
  }[];
  query: string;
};
