import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types/webgestor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckSquare, 
  Clock, 
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, projects, getUserTasks, getUserTeam, getTeamProjects, getProjectTasks, getProjectById, updateTask } = useData();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Get visible tasks based on role
  const getVisibleTasks = (): Task[] => {
    if (user?.role === 'admin') return tasks;
    
    if (user?.role === 'leader') {
      const userTeam = getUserTeam(user.id);
      if (!userTeam) return [];
      const teamProjects = getTeamProjects(userTeam.id);
      return teamProjects.flatMap(p => getProjectTasks(p.id));
    }
    
    // Collaborator
    return getUserTasks(user?.id || '');
  };

  const visibleTasks = getVisibleTasks();
  
  // Apply filters
  const filteredTasks = visibleTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask(taskId, { status: newStatus });
    toast({ title: 'Status atualizado!' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' && 'Todas as tarefas do sistema'}
          {user?.role === 'leader' && 'Tarefas da sua equipe'}
          {user?.role === 'collaborator' && 'Suas tarefas atribuídas'}
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-todo/20">
              <CheckSquare className="h-5 w-5 text-status-todo" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasksByStatus.todo.length}</p>
              <p className="text-sm text-muted-foreground">A fazer</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-in-progress/20">
              <Clock className="h-5 w-5 text-status-in-progress" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasksByStatus.in_progress.length}</p>
              <p className="text-sm text-muted-foreground">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-done/20">
              <CheckSquare className="h-5 w-5 text-status-done" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tasksByStatus.done.length}</p>
              <p className="text-sm text-muted-foreground">Concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="todo">A fazer ({tasksByStatus.todo.length})</TabsTrigger>
          <TabsTrigger value="in_progress">Em andamento ({tasksByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="done">Concluídas ({tasksByStatus.done.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <TaskList tasks={filteredTasks} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="todo" className="mt-4">
          <TaskList tasks={tasksByStatus.todo} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          <TaskList tasks={tasksByStatus.in_progress} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          <TaskList tasks={tasksByStatus.done} onStatusChange={handleStatusChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaskList({ 
  tasks, 
  onStatusChange 
}: { 
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const { getProjectById, getUserById } = useData();
  const { user } = useAuth();

  if (tasks.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityBadge = (priority: TaskPriority) => {
    const config: Record<TaskPriority, { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'border-priority-low text-priority-low' },
      medium: { label: 'Média', className: 'border-priority-medium text-priority-medium' },
      high: { label: 'Alta', className: 'border-priority-high text-priority-high' },
      urgent: { label: 'Urgente', className: 'border-priority-urgent text-priority-urgent' },
    };
    return <Badge variant="outline" className={config[priority].className}>{config[priority].label}</Badge>;
  };

  const canChangeStatus = (task: Task) => {
    return user?.role === 'admin' || user?.role === 'leader' || task.assigneeId === user?.id;
  };

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const project = getProjectById(task.projectId);
        const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
        
        return (
          <Card 
            key={task.id} 
            className={`shadow-card hover:shadow-glow transition-shadow ${isOverdue ? 'border-destructive/50' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{task.title}</h3>
                    {getPriorityBadge(task.priority)}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">Atrasada</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {task.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Projeto: 
                      <Link 
                        to={`/projects/${project?.id}`}
                        className="text-primary hover:underline"
                      >
                        {project?.name || 'N/A'}
                      </Link>
                    </span>
                    {assignee && (
                      <span>Responsável: {assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {canChangeStatus(task) ? (
                    <Select 
                      value={task.status} 
                      onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A fazer</SelectItem>
                        <SelectItem value="in_progress">Em andamento</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={task.status} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config: Record<TaskStatus, { label: string; className: string }> = {
    todo: { label: 'A fazer', className: 'bg-status-todo' },
    in_progress: { label: 'Em andamento', className: 'bg-status-in-progress text-warning-foreground' },
    done: { label: 'Concluído', className: 'bg-status-done' },
  };
  return <Badge className={config[status].className}>{config[status].label}</Badge>;
}
