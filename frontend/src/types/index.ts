export const Role = {
  COLLABORATEUR: 'COLLABORATEUR',
  RESPONSABLE_TECHNIQUE: 'RESPONSABLE_TECHNIQUE',
  DIRECTION: 'DIRECTION',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const TaskStatus = {
  EN_COURS: 'EN_COURS',
  BLOQUE: 'BLOQUE',
  TERMINE: 'TERMINE',
  EN_PAUSE: 'EN_PAUSE',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  teamId?: number;
};

export type AuthResponse = {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
};

export type Project = {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  budgetHours?: number;
  teamId?: number;
  teamName?: string;
  globalProgress: number;
  totalTimeSpentMinutes: number;
};

export type Task = {
  id: number;
  name: string;
  description?: string;
  status: TaskStatus;
  progressPercent: number;
  projectId: number;
  projectName: string;
  assigneeId?: number;
  assigneeName?: string;
  estimatedHours?: number;
  totalTimeSpentMinutes: number;
  technicalComment?: string;
};

export type DashboardStats = {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  globalProgressPercent: number;
  totalTimeSpentMinutes: number;
  budgetHoursTotal: number;
  projects: Project[];
  activeAlerts: Alert[];
};

export type Alert = {
  id: number;
  type: string;
  message: string;
  taskId?: number;
  taskName?: string;
  projectId?: number;
  projectName?: string;
  resolved: boolean;
  createdAt: string;
};

export type ActiveCollaborator = {
  userId: number;
  firstName: string;
  lastName: string;
  taskName: string;
  projectName: string;
  startTime: string;
  paused: boolean;
};

export type AIPrediction = {
  delayRisks: DelayRisk[];
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  modelName: string;
  modelAccuracy: string;
};

export type DelayRisk = {
  projectId: number;
  projectName: string;
  taskId: number;
  taskName: string;
  assigneeName: string;
  progressPercent: number;
  estimatedHours: number;
  consumedHours: number;
  predictedTotalHours: number;
  riskLevel: number;
  riskLabel: string;
  explanation: string;
  mlProbability: number;
};

export type Bottleneck = {
  type: string;
  entityName: string;
  description: string;
  severity: string;
};

export type Recommendation = {
  type: string;
  title: string;
  description: string;
  priority: string;
};

export type TeamMember = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  keyActive: boolean;
  keyPaused: boolean;
  currentTaskName?: string;
  currentProjectName?: string;
  keyStartTime?: string;
  tasks: MemberTask[];
};

export type MemberTask = {
  taskId: number;
  taskName: string;
  projectName: string;
  status: string;
  progressPercent: number;
  timeSpentMinutes: number;
};

export type TimeEntry = {
  id: number;
  userId: number;
  taskId: number;
  taskName: string;
  projectName: string;
  startTime: string;
  endTime?: string;
  paused: boolean;
  totalMinutes?: number;
};

export type WorkloadItem = {
  userId: number;
  firstName: string;
  lastName: string;
  totalMinutes: number;
  activeTasks: number;
  completedTasks: number;
  averageProgress: number;
};

export type KeyStatus = {
  active: boolean;
  taskId?: number;
  startTime?: string;
  paused?: boolean;
};
