import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { useProjetos, useTarefas, useUsuarios } from '@/hooks/useSupabaseData'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Supabase Data Hooks', () => {
  describe('useProjetos', () => {
    it('deve carregar lista de projetos', async () => {
      const mockProjects = [
        {
          id: '1',
          nome: 'Projeto Alpha',
          descricao: 'Primeiro projeto',
          status: 'ativo',
          progresso: 75,
          usuarios: { nome: 'João Silva', email: 'joao@example.com' },
          equipe_projetos: [],
        },
      ]

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValueOnce({
          data: mockProjects,
          error: null,
        }),
      } as any)

      const { result } = renderHook(() => useProjetos(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockProjects)
      expect(result.current.error).toBeNull()
    })

    it('deve lidar com erro ao carregar projetos', async () => {
      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any)

      const { result } = renderHook(() => useProjetos(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.isError).toBe(true)
    })
  })

  describe('useTarefas', () => {
    it('deve carregar tarefas de um projeto específico', async () => {
      const projectId = 'projeto-123'
      const mockTasks = [
        {
          id: '1',
          titulo: 'Tarefa 1',
          descricao: 'Descrição da tarefa 1',
          status: 'todo',
          prioridade: 'alta',
          projeto_id: projectId,
          usuarios: { nome: 'Maria Souza', email: 'maria@example.com' },
          projetos: { nome: 'Projeto Alpha' },
        },
      ]

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({
          data: mockTasks,
          error: null,
        }),
        order: vi.fn().mockReturnThis(),
      } as any)

      const { result } = renderHook(() => useTarefas(projectId), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockTasks)
    })

    it('não deve executar query quando projetoId não é fornecido', () => {
      const { supabase } = await import('@/lib/supabase')
      const fromSpy = vi.mocked(supabase.from)

      renderHook(() => useTarefas(), {
        wrapper: createWrapper(),
      })

      expect(fromSpy).not.toHaveBeenCalled()
    })
  })

  describe('useUsuarios', () => {
    it('deve carregar lista de usuários', async () => {
      const mockUsers = [
        {
          id: '1',
          nome: 'João Silva',
          email: 'joao@example.com',
          role: 'admin',
          avatar_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          nome: 'Maria Souza',
          email: 'maria@example.com',
          role: 'member',
          avatar_url: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const { supabase } = await import('@/lib/supabase')
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockUsers,
          error: null,
        }),
      } as any)

      const { result } = renderHook(() => useUsuarios(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual(mockUsers)
      expect(result.current.data).toHaveLength(2)
    })
  })
})

describe('Data Hook Performance', () => {
  it('deve invalidar cache corretamente após mutação', async () => {
    const queryClient = new QueryClient()
    
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValueOnce({
        data: [{ id: '1', nome: 'Projeto Teste' }],
        error: null,
      }),
      insert: vi.fn().mockResolvedValueOnce({
        data: { id: '2', nome: 'Novo Projeto' },
        error: null,
      }),
    } as any)

    // Primeiro render - carrega dados
    const { result: projetosResult } = renderHook(() => useProjetos(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await waitFor(() => {
      expect(projetosResult.current.isLoading).toBe(false)
    })

    expect(projetosResult.current.data).toHaveLength(1)

    // Simula mutação que deve invalidar cache
    const { useCriarProjeto } = await import('@/hooks/useSupabaseData')
    const { result: criarProjetoResult } = renderHook(() => useCriarProjeto(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    await criarProjetoResult.current.mutateAsync({
      nome: 'Novo Projeto',
      descricao: 'Descrição do novo projeto',
    })

    // Verifica se cache foi invalidado
    expect(queryClient.getQueryData(['projetos'])).toBeUndefined()
  })
})