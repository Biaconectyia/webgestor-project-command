import React, { useMemo } from 'react'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { useProjetos, useTarefas, useUsuarios } from '@/hooks/useSupabaseData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FolderOpen, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function SupabaseDashboard() {
  const { profile } = useSupabaseAuth()
  const { data: projetos = [], isLoading: projetosLoading, error: projetosError } = useProjetos()
  const { data: tarefas = [], isLoading: tarefasLoading, error: tarefasError } = useTarefas()
  const { data: usuarios = [], isLoading: usuariosLoading, error: usuariosError } = useUsuarios()

  const isLoading = projetosLoading || tarefasLoading || usuariosLoading
  const hasError = projetosError || tarefasError || usuariosError

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    )
  }

  if (hasError) {
    console.error('Dashboard Error:', { projetosError, tarefasError, usuariosError })
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Erro ao carregar dashboard</h2>
        <p className="text-muted-foreground">
          Não foi possível carregar alguns dados. Tente recarregar a página.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Recarregar
        </button>
      </div>
    )
  }

  const activeProjects = useMemo(() => projetos.filter(p => p.status === 'ativo').length, [projetos])
  const completedTasks = useMemo(() => tarefas.filter(t => t.status === 'done').length, [tarefas])
  const totalMembers = useMemo(() => usuarios.length, [usuarios])
  const pendingTasks = useMemo(() => tarefas.filter(t => t.status !== 'done').length, [tarefas])

  const projectStatusData = useMemo(() => ([
    { name: 'Ativos', value: projetos.filter(p => p.status === 'ativo').length, color: '#3b82f6' },
    { name: 'Pausados', value: projetos.filter(p => p.status === 'pausado').length, color: '#f59e0b' },
    { name: 'Concluídos', value: projetos.filter(p => p.status === 'concluido').length, color: '#10b981' },
    { name: 'Cancelados', value: projetos.filter(p => p.status === 'cancelado').length, color: '#ef4444' },
  ]), [projetos])

  const taskStatusData = useMemo(() => ([
    { name: 'A Fazer', value: tarefas.filter(t => t.status === 'todo').length },
    { name: 'Em Progresso', value: tarefas.filter(t => t.status === 'in_progress').length },
    { name: 'Concluídas', value: tarefas.filter(t => t.status === 'done').length },
  ]), [tarefas])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile?.nome || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              {projetos.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros da Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tarefas.length > 0 ? Math.round((completedTasks / tarefas.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Das tarefas totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progresso das Tarefas</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos Recentes</CardTitle>
          <CardDescription>Últimos projetos criados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projetos.slice(0, 5).map((projeto) => (
              <div key={projeto.id} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{projeto.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {projeto.descricao || 'Sem descrição'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {projeto.progresso}%
                  </div>
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${projeto.progresso}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
