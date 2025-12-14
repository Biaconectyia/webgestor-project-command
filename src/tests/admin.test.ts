import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerAdmin } from '@/services/admin'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  },
}))

describe('registerAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cria usuário e promove para admin', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: { id: 'u-1', email: 'sinvaldo.p.oliveira@gmail.com' } },
      error: null,
    } as any)

    const mockUpdate = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValueOnce({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(mockUpdate as any)

    const res = await registerAdmin({ email: 'sinvaldo.p.oliveira@gmail.com', password: '572419', nome: 'Sinvaldo Oliveira' })
    expect(res.success).toBe(true)
    expect(res.userId).toBe('u-1')
    expect(supabase.auth.signUp).toHaveBeenCalled()
    expect(mockUpdate.eq).toHaveBeenCalledWith('id', 'u-1')
  })

  it('falha se email já cadastrado', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: null }, error: { message: 'User already registered' } } as any)
    const res = await registerAdmin({ email: 'exists@example.com', password: '123456', nome: 'Teste' })
    expect(res.success).toBe(false)
    expect(res.error?.code).toBe('EMAIL_IN_USE')
  })

  it('valida senha fraca', async () => {
    const res = await registerAdmin({ email: 'a@b.com', password: '123', nome: 'Teste' })
    expect(res.success).toBe(false)
    expect(res.error?.code).toBe('WEAK_PASSWORD')
  })

  it('erro de promoção é retornado', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: { id: 'u-2' } }, error: null } as any)
    const mockUpdate = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValueOnce({ error: { message: 'Permission denied' } }) }
    vi.mocked(supabase.from).mockReturnValue(mockUpdate as any)
    const res = await registerAdmin({ email: 'x@y.com', password: '123456', nome: 'X' })
    expect(res.success).toBe(false)
    expect(res.error?.code).toBe('PROMOTE_ERROR')
  })

  it('retorna erro claro em "Database error saving new user"', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Database error saving new user' },
    } as any)

    const res = await registerAdmin({ email: 'x@y.com', password: '123456', nome: 'X' })
    expect(res.success).toBe(false)
    expect(res.error?.code).toBe('SIGNUP_ERROR')
    expect(res.error?.message).toContain('Database error')
  })
})
