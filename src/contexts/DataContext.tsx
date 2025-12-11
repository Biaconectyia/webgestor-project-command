import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team, Project, Task, Comment, Notification, ActivityLog, User, TeamMember } from '@/types/webgestor';
import { useAuth } from './AuthContext';

interface DataContextType {
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  users: User[];
  teamMembers: TeamMember[];
  
  // Teams
  createTeam: (team: Omit<Team, 'id' | 'createdAt'>) => Team;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  
  // Projects
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Comments
  addComment: (taskId: string, content: string) => Comment;
  
  // Team Members
  addTeamMember: (teamId: string, userId: string) => void;
  removeTeamMember: (teamId: string, userId: string) => void;
  
  // Users
  updateUserRole: (userId: string, role: User['role']) => void;
  
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Activity
  logActivity: (action: string, entityType: ActivityLog['entityType'], entityId: string, details?: string) => void;
  
  // Helpers
  getTeamById: (id: string) => Team | undefined;
  getProjectById: (id: string) => Project | undefined;
  getTaskById: (id: string) => Task | undefined;
  getUserById: (id: string) => User | undefined;
  getTeamMembers: (teamId: string) => User[];
  getTeamProjects: (teamId: string) => Project[];
  getProjectTasks: (projectId: string) => Task[];
  getTaskComments: (taskId: string) => Comment[];
  getUserTasks: (userId: string) => Task[];
  getUserTeam: (userId: string) => Team | undefined;
  getUnreadNotificationsCount: () => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  teams: 'webgestor_teams',
  projects: 'webgestor_projects',
  tasks: 'webgestor_tasks',
  comments: 'webgestor_comments',
  notifications: 'webgestor_notifications',
  activityLogs: 'webgestor_activity',
  teamMembers: 'webgestor_team_members',
};

function loadFromStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Load data on mount
  useEffect(() => {
    setTeams(loadFromStorage(STORAGE_KEYS.teams));
    setProjects(loadFromStorage(STORAGE_KEYS.projects));
    setTasks(loadFromStorage(STORAGE_KEYS.tasks));
    setComments(loadFromStorage(STORAGE_KEYS.comments));
    setNotifications(loadFromStorage(STORAGE_KEYS.notifications));
    setActivityLogs(loadFromStorage(STORAGE_KEYS.activityLogs));
    setTeamMembers(loadFromStorage(STORAGE_KEYS.teamMembers));
    
    // Load users from auth storage
    const storedUsers = JSON.parse(localStorage.getItem('webgestor_users') || '[]');
    setUsers(storedUsers.map((u: any) => {
      const { password, ...userData } = u;
      return userData;
    }));
  }, []);

  // Sync users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUsers = JSON.parse(localStorage.getItem('webgestor_users') || '[]');
      setUsers(storedUsers.map((u: any) => {
        const { password, ...userData } = u;
        return userData;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Teams
  const createTeam = (teamData: Omit<Team, 'id' | 'createdAt'>): Team => {
    const team: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...teams, team];
    setTeams(updated);
    saveToStorage(STORAGE_KEYS.teams, updated);
    logActivity('Equipe criada', 'team', team.id, team.name);
    return team;
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    const updated = teams.map(t => t.id === id ? { ...t, ...updates } : t);
    setTeams(updated);
    saveToStorage(STORAGE_KEYS.teams, updated);
    logActivity('Equipe atualizada', 'team', id);
  };

  const deleteTeam = (id: string) => {
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    saveToStorage(STORAGE_KEYS.teams, updated);
    logActivity('Equipe excluída', 'team', id);
  };

  // Projects
  const createProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const project: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...projects, project];
    setProjects(updated);
    saveToStorage(STORAGE_KEYS.projects, updated);
    logActivity('Projeto criado', 'project', project.id, project.name);
    return project;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updates } : p);
    setProjects(updated);
    saveToStorage(STORAGE_KEYS.projects, updated);
    logActivity('Projeto atualizado', 'project', id);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveToStorage(STORAGE_KEYS.projects, updated);
    logActivity('Projeto excluído', 'project', id);
  };

  // Tasks
  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const now = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...tasks, task];
    setTasks(updated);
    saveToStorage(STORAGE_KEYS.tasks, updated);
    logActivity('Tarefa criada', 'task', task.id, task.title);
    
    // Create notification for assignee
    if (task.assigneeId && task.assigneeId !== user?.id) {
      createNotification(task.assigneeId, 'task_assigned', 'Nova tarefa atribuída', `Você recebeu a tarefa: ${task.title}`, task.id);
    }
    
    return task;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const oldTask = tasks.find(t => t.id === id);
    const updated = tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
    setTasks(updated);
    saveToStorage(STORAGE_KEYS.tasks, updated);
    
    if (updates.status && oldTask && updates.status !== oldTask.status) {
      logActivity(`Status alterado para ${updates.status}`, 'task', id);
      if (oldTask.assigneeId) {
        createNotification(oldTask.assigneeId, 'status_changed', 'Status alterado', `A tarefa "${oldTask.title}" foi atualizada para: ${updates.status}`, id);
      }
    } else {
      logActivity('Tarefa atualizada', 'task', id);
    }
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveToStorage(STORAGE_KEYS.tasks, updated);
    logActivity('Tarefa excluída', 'task', id);
  };

  // Comments
  const addComment = (taskId: string, content: string): Comment => {
    if (!user) throw new Error('User not authenticated');
    
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      taskId,
      userId: user.id,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, comment];
    setComments(updated);
    saveToStorage(STORAGE_KEYS.comments, updated);
    
    const task = tasks.find(t => t.id === taskId);
    if (task?.assigneeId && task.assigneeId !== user.id) {
      createNotification(task.assigneeId, 'new_comment', 'Novo comentário', `Novo comentário na tarefa: ${task.title}`, taskId);
    }
    
    return comment;
  };

  // Team Members
  const addTeamMember = (teamId: string, userId: string) => {
    if (teamMembers.find(tm => tm.teamId === teamId && tm.userId === userId)) return;
    
    const member: TeamMember = {
      id: `tm-${Date.now()}`,
      teamId,
      userId,
      joinedAt: new Date().toISOString(),
    };
    const updated = [...teamMembers, member];
    setTeamMembers(updated);
    saveToStorage(STORAGE_KEYS.teamMembers, updated);
  };

  const removeTeamMember = (teamId: string, userId: string) => {
    const updated = teamMembers.filter(tm => !(tm.teamId === teamId && tm.userId === userId));
    setTeamMembers(updated);
    saveToStorage(STORAGE_KEYS.teamMembers, updated);
  };

  // Users
  const updateUserRole = (userId: string, role: User['role']) => {
    const storedUsers = JSON.parse(localStorage.getItem('webgestor_users') || '[]');
    const updated = storedUsers.map((u: any) => u.id === userId ? { ...u, role } : u);
    localStorage.setItem('webgestor_users', JSON.stringify(updated));
    setUsers(updated.map((u: any) => {
      const { password, ...userData } = u;
      return userData;
    }));
    logActivity(`Role alterada para ${role}`, 'user', userId);
  };

  // Notifications
  const createNotification = (userId: string, type: Notification['type'], title: string, message: string, relatedId?: string) => {
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      title,
      message,
      read: false,
      relatedId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...notifications, notification];
    setNotifications(updated);
    saveToStorage(STORAGE_KEYS.notifications, updated);
  };

  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveToStorage(STORAGE_KEYS.notifications, updated);
  };

  const markAllNotificationsRead = () => {
    if (!user) return;
    const updated = notifications.map(n => n.userId === user.id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveToStorage(STORAGE_KEYS.notifications, updated);
  };

  // Activity
  const logActivity = (action: string, entityType: ActivityLog['entityType'], entityId: string, details?: string) => {
    if (!user) return;
    
    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      userId: user.id,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    const updated = [log, ...activityLogs].slice(0, 100); // Keep last 100
    setActivityLogs(updated);
    saveToStorage(STORAGE_KEYS.activityLogs, updated);
  };

  // Helpers
  const getTeamById = (id: string) => teams.find(t => t.id === id);
  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);
  
  const getTeamMembers = (teamId: string): User[] => {
    const memberIds = teamMembers.filter(tm => tm.teamId === teamId).map(tm => tm.userId);
    return users.filter(u => memberIds.includes(u.id));
  };
  
  const getTeamProjects = (teamId: string) => projects.filter(p => p.teamId === teamId);
  const getProjectTasks = (projectId: string) => tasks.filter(t => t.projectId === projectId);
  const getTaskComments = (taskId: string) => comments.filter(c => c.taskId === taskId);
  const getUserTasks = (userId: string) => tasks.filter(t => t.assigneeId === userId);
  
  const getUserTeam = (userId: string): Team | undefined => {
    const membership = teamMembers.find(tm => tm.userId === userId);
    return membership ? teams.find(t => t.id === membership.teamId) : undefined;
  };
  
  const getUnreadNotificationsCount = () => {
    if (!user) return 0;
    return notifications.filter(n => n.userId === user.id && !n.read).length;
  };

  return (
    <DataContext.Provider value={{
      teams, projects, tasks, comments, notifications, activityLogs, users, teamMembers,
      createTeam, updateTeam, deleteTeam,
      createProject, updateProject, deleteProject,
      createTask, updateTask, deleteTask,
      addComment, addTeamMember, removeTeamMember, updateUserRole,
      markNotificationRead, markAllNotificationsRead, logActivity,
      getTeamById, getProjectById, getTaskById, getUserById,
      getTeamMembers, getTeamProjects, getProjectTasks, getTaskComments,
      getUserTasks, getUserTeam, getUnreadNotificationsCount,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
