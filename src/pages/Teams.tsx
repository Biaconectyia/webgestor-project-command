import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Team, User } from '@/types/webgestor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Plus, Users, Edit, Trash2, UserPlus, Crown } from 'lucide-react';

export default function TeamsPage() {
  const { user } = useAuth();
  const { teams, users, createTeam, updateTeam, deleteTeam, getTeamMembers, addTeamMember, removeTeamMember } = useData();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipes</h1>
          <p className="text-muted-foreground">Gerencie as equipes do sistema</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipe
            </Button>
          </DialogTrigger>
          <TeamFormDialog
            onClose={() => setIsCreateOpen(false)}
            onSubmit={(data) => {
              createTeam(data);
              setIsCreateOpen(false);
              toast({ title: 'Equipe criada com sucesso!' });
            }}
          />
        </Dialog>
      </div>

      {teams.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma equipe cadastrada.</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira equipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const members = getTeamMembers(team.id);
            const leader = users.find(u => u.id === team.leaderId);
            
            return (
              <Card key={team.id} className="shadow-card hover:shadow-glow transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {team.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {members.length} membros
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {leader && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Crown className="h-4 w-4 text-warning" />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {leader.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{leader.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">Líder</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map(member => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {members.length > 4 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setManagingTeam(team)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Membros
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTeam(team)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingTeam(team)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTeam && (
        <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
          <TeamFormDialog
            team={editingTeam}
            onClose={() => setEditingTeam(null)}
            onSubmit={(data) => {
              updateTeam(editingTeam.id, data);
              setEditingTeam(null);
              toast({ title: 'Equipe atualizada!' });
            }}
          />
        </Dialog>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingTeam} onOpenChange={() => setDeletingTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a equipe "{deletingTeam?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingTeam) {
                  deleteTeam(deletingTeam.id);
                  setDeletingTeam(null);
                  toast({ title: 'Equipe excluída!' });
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Members Dialog */}
      {managingTeam && (
        <Dialog open={!!managingTeam} onOpenChange={() => setManagingTeam(null)}>
          <ManageMembersDialog
            team={managingTeam}
            onClose={() => setManagingTeam(null)}
          />
        </Dialog>
      )}
    </div>
  );
}

function TeamFormDialog({
  team,
  onClose,
  onSubmit,
}: {
  team?: Team;
  onClose: () => void;
  onSubmit: (data: Omit<Team, 'id' | 'createdAt'>) => void;
}) {
  const { users } = useData();
  const [name, setName] = useState(team?.name || '');
  const [description, setDescription] = useState(team?.description || '');
  const [leaderId, setLeaderId] = useState(team?.leaderId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description, leaderId: leaderId || undefined });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{team ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
        <DialogDescription>
          {team ? 'Atualize os dados da equipe' : 'Preencha os dados para criar uma nova equipe'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Equipe</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Marketing"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição da equipe..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="leader">Líder da Equipe</Label>
          <Select value={leaderId} onValueChange={setLeaderId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um líder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum líder</SelectItem>
              {users.filter(u => u.role !== 'admin').map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {team ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ManageMembersDialog({
  team,
  onClose,
}: {
  team: Team;
  onClose: () => void;
}) {
  const { users, getTeamMembers, addTeamMember, removeTeamMember, updateTeam, updateUserRole } = useData();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState('');
  
  const members = getTeamMembers(team.id);
  const availableUsers = users.filter(
    u => u.role !== 'admin' && !members.find(m => m.id === u.id)
  );

  const handleAddMember = () => {
    if (!selectedUser) return;
    addTeamMember(team.id, selectedUser);
    updateUserRole(selectedUser, 'collaborator');
    setSelectedUser('');
    toast({ title: 'Membro adicionado!' });
  };

  const handleRemoveMember = (userId: string) => {
    removeTeamMember(team.id, userId);
    if (team.leaderId === userId) {
      updateTeam(team.id, { leaderId: undefined });
    }
    toast({ title: 'Membro removido!' });
  };

  const handleSetLeader = (userId: string) => {
    updateTeam(team.id, { leaderId: userId });
    updateUserRole(userId, 'leader');
    toast({ title: 'Líder definido!' });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Gerenciar Membros - {team.name}</DialogTitle>
        <DialogDescription>
          Adicione ou remova membros da equipe
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.length === 0 ? (
                <SelectItem value="" disabled>Nenhum usuário disponível</SelectItem>
              ) : (
                availableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button onClick={handleAddMember} disabled={!selectedUser}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="border rounded-lg divide-y">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4 text-center">
              Nenhum membro na equipe
            </p>
          ) : (
            members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {team.leaderId === member.id && (
                    <Badge variant="outline" className="ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Líder
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {team.leaderId !== member.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetLeader(member.id)}
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
