import { supabase } from '@/lib/supabase'

export type RegisterAdminInput = {
  email: string
  password: string
  nome: string
}

export type RegisterAdminResult = {
  success: boolean
  userId?: string
  error?: { code: string; message: string }
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email)
}

export async function registerAdmin({ email, password, nome }: RegisterAdminInput): Promise<RegisterAdminResult> {
  if (!isValidEmail(email)) return { success: false, error: { code: 'INVALID_EMAIL', message: 'Email inválido' } }
  if (!password || password.length < 6) return { success: false, error: { code: 'WEAK_PASSWORD', message: 'Senha muito fraca' } }
  if (!nome || !nome.trim()) return { success: false, error: { code: 'INVALID_NAME', message: 'Nome obrigatório' } }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { nome } } })
    if (error) {
      const msg = (error as any)?.message || ''
      if (/already/i.test(msg)) return { success: false, error: { code: 'EMAIL_IN_USE', message: 'Email já cadastrado' } }
      return { success: false, error: { code: 'SIGNUP_ERROR', message: msg || 'Erro ao cadastrar' } }
    }

    const id = data.user?.id
    if (!id) return { success: false, error: { code: 'NO_USER_ID', message: 'Usuário criado sem ID' } }

    const { error: promoteError } = await supabase.from('usuarios').update({ role: 'admin', nome }).eq('id', id)
    if (promoteError) return { success: false, error: { code: 'PROMOTE_ERROR', message: promoteError.message } }

    return { success: true, userId: id }
  } catch (e: any) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: e?.message || 'Problema de conexão' } }
  }
}
