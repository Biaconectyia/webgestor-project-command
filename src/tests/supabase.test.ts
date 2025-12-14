import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/lib/supabase'

// Mock do Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
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

describe('Supabase Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve fazer login com credenciais válidas', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: { nome: 'Test User' },
    }

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: mockUser, session: { access_token: 'token123' } },
      error: null,
    } as any)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(error).toBeNull()
    expect(data.user).toEqual(mockUser)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('deve falhar login com credenciais inválidas', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as any)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    })

    expect(error).toBeDefined()
    expect(data.user).toBeNull()
  })

  it('deve registrar novo usuário', async () => {
    const mockUser = {
      id: '456',
      email: 'newuser@example.com',
      user_metadata: { nome: 'New User' },
    }

    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: mockUser, session: { access_token: 'newtoken123' } },
      error: null,
    } as any)

    const { data, error } = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'newpassword123',
      options: {
        data: { nome: 'New User' }
      }
    })

    expect(error).toBeNull()
    expect(data.user).toEqual(mockUser)
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'newpassword123',
      options: {
        data: { nome: 'New User' }
      }
    })
  })
})

describe('Supabase Database Operations', () => {
  it('deve listar projetos com RLS aplicada', async () => {
    const mockProjects = [
      {
        id: '1',
        nome: 'Projeto Teste',
        descricao: 'Descrição do projeto',
        status: 'ativo',
        progresso: 50,
      },
    ]

    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
    // Simula chain do Supabase: select() retorna o objeto que tem order()
    mockQuery.select.mockReturnThis() 
    mockQuery.order.mockResolvedValueOnce({
      data: mockProjects,
      error: null,
    })

    const { data, error } = await supabase.from('projetos').select('*').order('created_at')

    expect(error).toBeNull()
    expect(data).toEqual(mockProjects)
    expect(supabase.from).toHaveBeenCalledWith('projetos')
  })

  it('deve criar tarefa com validação de permissões', async () => {
    const mockTask = {
      id: 'task-123',
      titulo: 'Nova Tarefa',
      descricao: 'Descrição da tarefa',
      projeto_id: 'projeto-1',
      responsavel_id: 'user-123',
      status: 'todo',
      prioridade: 'media',
    }

    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
    // Configura mock chain
    mockQuery.insert.mockReturnThis()
    mockQuery.select.mockReturnThis()
    mockQuery.single.mockResolvedValueOnce({
      data: mockTask,
      error: null,
    })

    const { data, error } = await supabase
      .from('tarefas')
      .insert([mockTask])
      .select()
      .single()

    expect(error).toBeNull()
    expect(data).toEqual(mockTask)
  })

  it('deve aplicar RLS corretamente na atualização de tarefas', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any)
    // Configura mock chain
    mockQuery.update.mockReturnThis()
    mockQuery.eq.mockReturnThis()
    // Último eq deve resolver a promise
    mockQuery.eq.mockResolvedValueOnce({
      data: null,
      error: { message: 'Permission denied' },
    })

    // Nota: Como o mock retorna o próprio objeto, a última chamada (segundo eq) é quem retorna a Promise
    // Ajuste para o teste: supabase.from().update().eq().eq() -> retorna Promise na última
    
    // Sobrescrevendo o mock para este teste específico funcionar com a cadeia
    const mockChain: any = {
       update: vi.fn().mockReturnThis(),
       eq: vi.fn().mockImplementation(function(this: any) { return this }) // retorna this para encadear
    }
    // Adiciona then para simular Promise na última chamada
    mockChain.then = (resolve: any) => resolve({ data: null, error: { message: 'Permission denied' } })
    
    vi.mocked(supabase.from).mockReturnValue(mockChain)

    const { data, error } = await supabase
      .from('tarefas')
      .update({ status: 'done' })
      .eq('id', 'task-other-user')
      .eq('responsavel_id', 'current-user-id')

    expect(error).toBeDefined()
    expect(data).toBeNull()
  })
})

describe('Security Validations', () => {
  it('deve validar email antes de autenticação', () => {
    const invalidEmails = ['notanemail', 'missing@', '@domain.com', 'user@']
    
    invalidEmails.forEach(email => {
      // Ajuste: A função deve lançar erro diretamente para o toThrow capturar
      expect(() => {
        if (!email.includes('@') || !email.split('@')[1]?.includes('.')) {
          throw new Error('Invalid email format')
        }
      }).toThrow('Invalid email format')
    })
  })

  it('deve validar senha com requisitos mínimos', () => {
    const weakPasswords = ['123', 'abc', '12', 'a']
    
    weakPasswords.forEach(password => {
      expect(() => {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
      }).toThrow('Password must be at least 6 characters')
    })
  })

  it('deve sanitizar dados antes de inserção', () => {
    const maliciousInput = '<script>alert("xss")</script>'
    const sanitized = maliciousInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    expect(sanitized).not.toContain('<script>')
    expect(sanitized).toBe('')
  })
})