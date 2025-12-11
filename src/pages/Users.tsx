import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types/webgestor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, User as UserIcon } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { users, updateUserRole, getUserTeam } = useData();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast({ 
        title: 'Não é possível alterar sua própria role',
        variant: 'destructive'
      });
      return;
    }
    updateUserRole(userId, newRole);
    toast({ title: 'Permissão atualizada!' });
  };

  const getRoleBadge = (role: UserRole) => {
    const config: Record<UserRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      admin: { label: 'Admin', variant: 'default' },
      leader: { label: 'Líder', variant: 'secondary' },
      collaborator: { label: 'Colaborador', variant: 'outline' },
    };
    return <Badge variant={config[role].variant}>{config[role].label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
                <SelectItem value="collaborator">Colaborador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(u => {
                const team = getUserTeam(u.id);
                const isCurrentUser = u.id === currentUser?.id;
                
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground">(você)</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {team ? (
                        <Badge variant="outline">{team.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem equipe</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        getRoleBadge(u.role)
                      ) : (
                        <Select 
                          value={u.role} 
                          onValueChange={(v) => handleRoleChange(u.id, v as UserRole)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="leader">Líder</SelectItem>
                            <SelectItem value="collaborator">Colaborador</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
