import React, { useState } from 'react'
import { useTarefas, useAtualizarTarefa, useCriarTarefa } from '@/hooks/useSupabaseData'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Calendar, User, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
}

const PRIORITY_COLORS = {
  baixa: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800',
}

export default function SupabaseTasks({ projetoId }: { projetoId?: string }) {
  const { profile } = useSupabaseAuth()
  const { data: tarefas = [], isLoading } = useTarefas(projetoId)
  const atualizarTarefa = useAtualizarTarefa()
  const criarTarefa = useCriarTarefa()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    projeto_id: projetoId || '',
    responsavel_id: '',
    status: 'todo' as const,
    prioridade: 'media' as const,
    prazo: '',
  })

  const handleStatusChange = async (tarefaId: string, newStatus: string) => {
    try {
      await atualizarTarefa.mutateAsync({
        id: tarefaId,
        status: newStatus as 'todo' | 'in_progress' | 'done',
      })
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const tarefaData = {
      ...formData,
      projeto_id: formData.projeto_id || projetoId,
      prazo: formData.prazo || null,
    }

    try {
      await criarTarefa.mutateAsync(tarefaData)
      setIsDialogOpen(false)
      setFormData({
        titulo: '',
        descricao: '',
        projeto_id: projetoId || '',
        responsavel_id: '',
        status: 'todo',
        prioridade: 'media',
        prazo: '',
      })
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const tarefasAfazer = tarefas.filter(t => t.status === 'todo')
  const tarefasProgresso = tarefas.filter(t => t.status === 'in_progress')
  const tarefasConcluidas = tarefas.filter(t => t.status === 'done')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {projetoId ? 'Tarefas do Projeto' : 'Todas as Tarefas'}
          </h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe suas tarefas
          </p>
        </div>
        
        {(profile?.role === 'admin' || profile?.role === 'manager') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <DialogDescription>
                  Preencha as informações da nova tarefa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={(value: any) => setFormData({ ...formData, prioridade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input
                    id="prazo"
                    type="date"
                    value={formData.prazo}
                    onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={criarTarefa.isPending}>
                    {criarTarefa.isPending ? 'Criando...' : 'Criar Tarefa'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* To Do */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              A Fazer ({tarefasAfazer.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasAfazer.map((tarefa) => (
              <Card key={tarefa.id} className="border-l-4 border-l-gray-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{tarefa.titulo}</CardTitle>
                    <Badge className={PRIORITY_COLORS[tarefa.prioridade]}>
                      {tarefa.prioridade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tarefa.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tarefa.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {tarefa.usuarios && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{tarefa.usuarios.nome}</span>
                      </div>
                    )}
                    {tarefa.prazo && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(tarefa.prazo), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <Select
                      value={tarefa.status}
                      onValueChange={(value) => handleStatusChange(tarefa.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Em Progresso ({tarefasProgresso.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasProgresso.map((tarefa) => (
              <Card key={tarefa.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{tarefa.titulo}</CardTitle>
                    <Badge className={PRIORITY_COLORS[tarefa.prioridade]}>
                      {tarefa.prioridade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tarefa.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tarefa.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {tarefa.usuarios && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{tarefa.usuarios.nome}</span>
                      </div>
                    )}
                    {tarefa.prazo && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(tarefa.prazo), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <Select
                      value={tarefa.status}
                      onValueChange={(value) => handleStatusChange(tarefa.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Done */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Concluídas ({tarefasConcluidas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tarefasConcluidas.map((tarefa) => (
              <Card key={tarefa.id} className="border-l-4 border-l-green-400 opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm line-through">{tarefa.titulo}</CardTitle>
                    <Badge className={PRIORITY_COLORS[tarefa.prioridade]}>
                      {tarefa.prioridade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tarefa.descricao && (
                    <p className="text-sm text-muted-foreground line-clamp-2 line-through">
                      {tarefa.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {tarefa.usuarios && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{tarefa.usuarios.nome}</span>
                      </div>
                    )}
                    {tarefa.prazo && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(tarefa.prazo), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                  
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <Select
                      value={tarefa.status}
                      onValueChange={(value) => handleStatusChange(tarefa.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {tarefas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-muted-foreground text-center">
              {profile?.role === 'admin' || profile?.role === 'manager'
                ? 'Crie sua primeira tarefa para começar a organizar seu trabalho.'
                : 'Aguarde que um administrador ou gerente crie tarefas para você.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}