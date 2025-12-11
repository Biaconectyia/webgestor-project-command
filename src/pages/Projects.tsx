import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectStatus } from '@/types/webgestor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, FolderKanban, Edit, Trash2, Calendar, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { projects, teams, createProject, updateProject, deleteProject, getProjectTasks, getUserTeam, getTeamProjects, getTeamById } = useData();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Filter projects based on role
  const getVisibleProjects = () => {
    if (user?.role === 'admin') return projects;
    if (user?.role === 'leader') {
      const userTeam = getUserTeam(user.id);
      return userTeam ? getTeamProjects(userTeam.id) : [];
    }
    return [];
  };

  const visibleProjects = getVisibleProjects();
  const canCreate = user?.role === 'admin';

  const getStatusBadge = (status: ProjectStatus) => {
    const config: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      active: { label: 'Ativo', variant: 'default' },
      completed: { label: 'Concluído', variant: 'secondary' },
      paused: { label: 'Pausado', variant: 'outline' },
    };
    return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground">
            {user?.role === 'admin' ? 'Todos os projetos do sistema' : 'Projetos da sua equipe'}
          </p>
        </div>
        {canCreate && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </DialogTrigger>
            <ProjectFormDialog
              onClose={() => setIsCreateOpen(false)}
              onSubmit={(data) => {
                createProject(data);
                setIsCreateOpen(false);
                toast({ title: 'Projeto criado com sucesso!' });
              }}
            />
          </Dialog>
        )}
      </div>

      {visibleProjects.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
            {canCreate && (
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro projeto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProjects.map(project => {
            const tasks = getProjectTasks(project.id);
            const completedTasks = tasks.filter(t => t.status === 'done').length;
            const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
            const team = getTeamById(project.teamId);
            
            return (
              <Card key={project.id} className="shadow-card hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {project.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{team?.name || 'Sem equipe'}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        Tarefas
                      </span>
                      <span className="font-medium">{completedTasks}/{tasks.length}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {project.endDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Prazo: {new Date(project.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link to={`/projects/${project.id}`}>
                        Ver detalhes
                      </Link>
                    </Button>
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingProject(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingProject(project)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <ProjectFormDialog
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSubmit={(data) => {
              updateProject(editingProject.id, data);
              setEditingProject(null);
              toast({ title: 'Projeto atualizado!' });
            }}
          />
        </Dialog>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{deletingProject?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingProject) {
                  deleteProject(deletingProject.id);
                  setDeletingProject(null);
                  toast({ title: 'Projeto excluído!' });
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectFormDialog({
  project,
  onClose,
  onSubmit,
}: {
  project?: Project;
  onClose: () => void;
  onSubmit: (data: Omit<Project, 'id' | 'createdAt'>) => void;
}) {
  const { teams } = useData();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [teamId, setTeamId] = useState(project?.teamId || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'active');
  const [startDate, setStartDate] = useState(project?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(project?.endDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      teamId,
      status,
      startDate,
      endDate: endDate || undefined,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        <DialogDescription>
          {project ? 'Atualize os dados do projeto' : 'Preencha os dados para criar um novo projeto'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Redesign do Site"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do projeto..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team">Equipe</Label>
            <Select value={teamId} onValueChange={setTeamId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Prazo Final</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {project ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
