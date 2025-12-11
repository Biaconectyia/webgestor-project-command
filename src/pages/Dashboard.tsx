import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { teams, projects, tasks, users, getUserTasks, getUserTeam, getTeamProjects, getProjectTasks } = useData();

  // Calculate stats based on user role
  const getStats = () => {
    if (user?.role === 'admin') {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length;
      
      return {
        teams: teams.length,
        projects: projects.length,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        users: users.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }
    
    if (user?.role === 'leader') {
      const userTeam = getUserTeam(user.id);
      if (!userTeam) return null;
      
      const teamProjects = getTeamProjects(userTeam.id);
      const teamTasks = teamProjects.flatMap(p => getProjectTasks(p.id));
      const completedTasks = teamTasks.filter(t => t.status === 'done').length;
      const inProgressTasks = teamTasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = teamTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length;
      
      return {
        team: userTeam,
        projects: teamProjects.length,
        totalTasks: teamTasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: teamTasks.length > 0 ? Math.round((completedTasks / teamTasks.length) * 100) : 0,
      };
    }
    
    // Collaborator
    const myTasks = getUserTasks(user?.id || '');
    const completedTasks = myTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = myTasks.filter(t => t.status === 'todo').length;
    const overdueTasks = myTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    
    return {
      totalTasks: myTasks.length,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      completionRate: myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0,
    };
  };

  const stats = getStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Você ainda não está em uma equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user?.name}!
        </h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' && 'Visão geral do sistema'}
          {user?.role === 'leader' && `Dashboard da equipe ${(stats as any).team?.name || ''}`}
          {user?.role === 'collaborator' && 'Suas tarefas e atividades'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'admin' && (
          <>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Equipes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).teams}</div>
                <p className="text-xs text-muted-foreground">equipes ativas</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Projetos</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats as any).projects}</div>
                <p className="text-xs text-muted-foreground">projetos em andamento</p>
              </CardContent>
            </Card>
          </>
        )}
        
        {user?.role === 'leader' && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projetos da Equipe</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats as any).projects}</div>
              <p className="text-xs text-muted-foreground">projetos ativos</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} concluídas
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">tarefas ativas</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">precisam de atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Taxa de Conclusão
          </CardTitle>
          <CardDescription>
            Progresso geral das tarefas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <span className="text-sm font-medium">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-done" />
                <span className="text-muted-foreground">Concluídas: {stats.completedTasks}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-in-progress" />
                <span className="text-muted-foreground">Em andamento: {stats.inProgressTasks}</span>
              </div>
              {user?.role === 'collaborator' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-todo" />
                  <span className="text-muted-foreground">A fazer: {(stats as any).todoTasks}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tasks for Collaborator */}
      {user?.role === 'collaborator' && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Minhas Tarefas Recentes</CardTitle>
            <CardDescription>Tarefas atribuídas a você</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTasks userId={user.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecentTasks({ userId }: { userId: string }) {
  const { getUserTasks, getProjectById } = useData();
  const myTasks = getUserTasks(userId).slice(0, 5);
  
  if (myTasks.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma tarefa atribuída.</p>;
  }
  
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      todo: { label: 'A fazer', className: 'bg-status-todo text-foreground' },
      in_progress: { label: 'Em andamento', className: 'bg-status-in-progress text-warning-foreground' },
      done: { label: 'Concluído', className: 'bg-status-done text-success-foreground' },
    };
    return <Badge className={config[status]?.className}>{config[status]?.label}</Badge>;
  };
  
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'border-priority-low text-priority-low' },
      medium: { label: 'Média', className: 'border-priority-medium text-priority-medium' },
      high: { label: 'Alta', className: 'border-priority-high text-priority-high' },
      urgent: { label: 'Urgente', className: 'border-priority-urgent text-priority-urgent' },
    };
    return <Badge variant="outline" className={config[priority]?.className}>{config[priority]?.label}</Badge>;
  };
  
  return (
    <div className="space-y-3">
      {myTasks.map(task => {
        const project = getProjectById(task.projectId);
        return (
          <div 
            key={task.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{task.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {project?.name || 'Projeto não encontrado'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {getPriorityBadge(task.priority)}
              {getStatusBadge(task.status)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
