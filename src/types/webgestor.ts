export type UserRole = 'admin' | 'leader' | 'collaborator';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  teamId?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  goals?: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'deadline_approaching' | 'status_changed' | 'new_comment';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'team' | 'project' | 'task' | 'user';
  entityId: string;
  details?: string;
  createdAt: string;
}
