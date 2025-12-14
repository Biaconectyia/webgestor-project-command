import React from 'react'
import { useUsuarios } from '@/hooks/useSupabaseData'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SupabaseTeam() {
  const { profile } = useSupabaseAuth()
  const { data: usuarios = [], isLoading } = useUsuarios()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Administrador</Badge>
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800">Gerente</Badge>
      case 'member':
        return <Badge className="bg-green-100 text-green-800">Membro</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>
    }
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie e visualize os membros da sua equipe
          </p>
        </div>
        
        {profile?.role === 'admin' && (
          <div className="text-sm text-muted-foreground">
            {usuarios.length} membros
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((usuario) => (
          <Card key={usuario.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {usuario.avatar_url ? (
                    <AvatarImage src={usuario.avatar_url} alt={usuario.nome} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(usuario.nome)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                  <CardDescription>{usuario.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Função</span>
                {getRoleBadge(usuario.role)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{usuario.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Membro desde {format(new Date(usuario.created_at), 'MMM yyyy', { locale: ptBR })}
                </span>
              </div>
              
              {usuario.id === profile?.id && (
                <Badge variant="outline" className="w-fit">
                  Você
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {usuarios.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum membro encontrado</h3>
            <p className="text-muted-foreground text-center">
              {profile?.role === 'admin'
                ? 'Convide novos membros para sua equipe.'
                : 'Aguarde que um administrador adicione novos membros.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}