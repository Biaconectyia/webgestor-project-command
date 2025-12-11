import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types/webgestor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  ArrowLeft, 
  Calendar, 
  CheckSquare,
  Clock,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { 
    getProjectById, 
    getTeamById, 
    getProjectTasks, 
    getTeamMembers,
    createTask,
    updateTask,
  } = useData();
  const { toast } = useToast();
  
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const project = getProjectById(id || '');
  
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Projeto não encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>
    );
  }
  
  const team = getTeamById(project.teamId);
  const tasks = getProjectTasks(project.id);
  const teamMembers = team ? getTeamMembers(team.id) : [];
  
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  
  const canManageTasks = user?.role === 'admin' || user?.role === 'leader';
  
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    updateTask(taskId, { status });
    toast({ title: 'Status atualizado!' });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <p className="text-muted-foreground">{project.description || 'Sem descrição'}</p>
        </div>
        {canManageTasks && (
          <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <TaskFormDialog
              projectId={project.id}
              teamMembers={teamMembers}
              onClose={() => setIsCreateTaskOpen(false)}
              onSubmit={(data) => {
                createTask(data);
                setIsCreateTaskOpen(false);
                toast({ title: 'Tarefa criada!' });
              }}
            />
          </Dialog>
        )}
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Badge variant="outline">{team?.name || 'Sem equipe'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Equipe responsável</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{completedTasks}/{tasks.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-4">
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Progresso geral</p>
          </CardContent>
        </Card>
        {project.endDate && (
          <Card className="shadow-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {new Date(project.endDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Prazo final</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => (
          <div
            key={status}
            className="bg-muted/30 rounded-lg p-4"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <StatusIcon status={status} />
                {getStatusLabel(status)}
              </h3>
              <Badge variant="secondary">{tasksByStatus[status].length}</Badge>
            </div>
            <div className="space-y-3">
              {tasksByStatus[status].map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
              {tasksByStatus[status].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tarefa
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <TaskDetailDialog
            task={selectedTask}
            teamMembers={teamMembers}
            canEdit={canManageTasks || selectedTask.assigneeId === user?.id}
            onClose={() => setSelectedTask(null)}
          />
        </Dialog>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  const icons = {
    todo: <div className="w-3 h-3 rounded-full bg-status-todo" />,
    in_progress: <Clock className="w-4 h-4 text-status-in-progress" />,
    done: <CheckSquare className="w-4 h-4 text-status-done" />,
  };
  return icons[status];
}

function getStatusLabel(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    todo: 'A fazer',
    in_progress: 'Em andamento',
    done: 'Concluído',
  };
  return labels[status];
}

function TaskCard({ 
  task, 
  onDragStart,
  onClick,
}: { 
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick: () => void;
}) {
  const { getUserById, getTaskComments } = useData();
  const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;
  const comments = getTaskComments(task.id);
  
  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      low: 'border-l-priority-low',
      medium: 'border-l-priority-medium',
      high: 'border-l-priority-high',
      urgent: 'border-l-priority-urgent',
    };
    return colors[priority];
  };

  return (
    <Card
      className={`shadow-card cursor-pointer hover:shadow-glow transition-shadow border-l-4 ${getPriorityColor(task.priority)}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {comments.length > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {comments.length}
              </span>
            )}
            {assignee && (
              <Badge variant="secondary" className="text-xs">
                {assignee.name.split(' ')[0]}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskFormDialog({
  projectId,
  teamMembers,
  onClose,
  onSubmit,
}: {
  projectId: string;
  teamMembers: any[];
  onClose: () => void;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      projectId,
      assigneeId: assigneeId || undefined,
      status: 'todo',
      priority,
      dueDate: dueDate || undefined,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Tarefa</DialogTitle>
        <DialogDescription>Crie uma nova tarefa para o projeto</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Criar wireframes"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes da tarefa..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assignee">Responsável</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não atribuído</SelectItem>
                {teamMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Prazo</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Criar</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function TaskDetailDialog({
  task,
  teamMembers,
  canEdit,
  onClose,
}: {
  task: Task;
  teamMembers: any[];
  canEdit: boolean;
  onClose: () => void;
}) {
  const { updateTask, addComment, getTaskComments, getUserById } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [newComment, setNewComment] = useState('');
  
  const comments = getTaskComments(task.id);
  const assignee = task.assigneeId ? getUserById(task.assigneeId) : null;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    updateTask(task.id, { status: newStatus });
    toast({ title: 'Status atualizado!' });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(task.id, newComment);
    setNewComment('');
    toast({ title: 'Comentário adicionado!' });
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    const labels: Record<TaskPriority, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority];
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{task.title}</DialogTitle>
        <DialogDescription>{task.description || 'Sem descrição'}</DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
          <TabsTrigger value="comments" className="flex-1">
            Comentários ({comments.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              {canEdit ? (
                <Select value={status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A fazer</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 font-medium">{getStatusLabel(task.status)}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Prioridade</Label>
              <p className="mt-1 font-medium">{getPriorityLabel(task.priority)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Responsável</Label>
              <p className="mt-1 font-medium">{assignee?.name || 'Não atribuído'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prazo</Label>
              <p className="mt-1 font-medium">
                {task.dueDate 
                  ? new Date(task.dueDate).toLocaleDateString('pt-BR')
                  : 'Sem prazo'
                }
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment}>Enviar</Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum comentário ainda
              </p>
            ) : (
              comments.map(comment => {
                const author = getUserById(comment.userId);
                return (
                  <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{author?.name || 'Usuário'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
