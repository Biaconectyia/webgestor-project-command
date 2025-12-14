import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Hook para buscar dados do usuário logado
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

// Hook para listar projetos visíveis ao usuário
export function useProjetos() {
  return useQuery({
    queryKey: ['projetos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          usuarios!gerente_id(nome, email),
          equipe_projetos(
            usuarios(id, nome, email, role)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Hook para listar tarefas
export function useTarefas(projetoId?: string) {
  return useQuery({
    queryKey: ['tarefas', projetoId],
    queryFn: async () => {
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          usuarios!responsavel_id(nome, email),
          projetos(nome)
        `)
        .order('created_at', { ascending: false })
      
      if (projetoId) {
        query = query.eq('projeto_id', projetoId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data
    },
    enabled: projetoId !== undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Hook para listar usuários
export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true })
      
      if (error) throw error
      return data
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

// Hook para criar projeto
export function useCriarProjeto() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projeto: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('projetos')
        .insert(projeto)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] })
    },
  })
}

// Hook para criar tarefa
export function useCriarTarefa() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (tarefa: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('tarefas')
        .insert(tarefa)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tarefas', variables.projeto_id] })
    },
  })
}

// Hook para atualizar tarefa
export function useAtualizarTarefa() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from('tarefas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      const projetoId = (data as Record<string, unknown>)?.projeto_id
      if (projetoId) {
        queryClient.invalidateQueries({ queryKey: ['tarefas', projetoId] })
      }
    },
  })
}
