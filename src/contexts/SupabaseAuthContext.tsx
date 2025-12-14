import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const SEED_ADMIN_EMAIL = import.meta.env.VITE_SEED_ADMIN_EMAIL
const SEED_ADMIN_PASSWORD = import.meta.env.VITE_SEED_ADMIN_PASSWORD
const SEED_ADMIN_NAME = import.meta.env.VITE_SEED_ADMIN_NAME || 'Admin'

interface Profile {
  id: string
  email: string
  nome: string
  role: string
  avatar_url?: string | null
  created_at: string
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  register: (email: string, password: string, nome: string) => Promise<{ error: { message: string } | null }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: { message: string } | null }>
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const envMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  const mapErrorMessage = (msg?: string): string => {
    if (envMissing) return 'Configuração do Supabase ausente (.env). Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
    if (!msg) return 'Erro desconhecido ao autenticar.'
    const lower = msg.toLowerCase()
    if (lower.includes('failed to fetch') || lower.includes('fetch')) {
      return 'Falha na conexão com o Supabase. Verifique internet, URL e chaves.'
    }
    if (lower.includes('invalid login') || lower.includes('invalid')) {
      return 'Credenciais inválidas. Verifique email e senha.'
    }
    return msg
  }

  const loadProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
          console.warn('Perfil não encontrado, tentando criar manualmente...')
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            const newProfile = {
              id: userId,
              email: userData.user.email || '',
              nome: (userData.user.user_metadata?.nome as string) || 'Usuário',
              role: 'member',
            }
            const { error: insertError } = await supabase.from('usuarios').insert(newProfile)
            if (!insertError) {
              setProfile({ ...newProfile, avatar_url: null, created_at: new Date().toISOString() })
              return
            }
          }
        }
        throw error
      }
      
      const profileData = data as Record<string, unknown>
      setProfile({
        id: profileData.id as string,
        email: profileData.email as string,
        nome: profileData.nome as string,
        role: profileData.role as string,
        avatar_url: profileData.avatar_url as string | null,
        created_at: profileData.created_at as string,
      })
      
      // Auto-promote seed admin account
      if (profileData.email === SEED_ADMIN_EMAIL && profileData.role !== 'admin') {
        await supabase
          .from('usuarios')
          .update({ role: 'admin', nome: SEED_ADMIN_NAME })
          .eq('id', userId)
        const { data: refreshed } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userId)
          .single()
        if (refreshed) {
          const r = refreshed as Record<string, unknown>
          setProfile({
            id: r.id as string,
            email: r.email as string,
            nome: r.nome as string,
            role: r.role as string,
            avatar_url: r.avatar_url as string | null,
            created_at: r.created_at as string,
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            await loadProfile(session.user.id)
          } else if (SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
            const seededFlag = localStorage.getItem('webgestor_seed_admin_done')
            if (!seededFlag) {
              try {
                const { data } = await supabase.auth.signUp({
                  email: SEED_ADMIN_EMAIL,
                  password: SEED_ADMIN_PASSWORD,
                  options: { data: { nome: SEED_ADMIN_NAME } },
                })
                if (data?.user && mounted) {
                  setUser(data.user)
                  await loadProfile(data.user.id)
                }
                localStorage.setItem('webgestor_seed_admin_done', '1')
              } catch (e) {
                console.error('Seed error:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        if (user?.id !== currentUser.id) {
          await loadProfile(currentUser.id)
        }
      } else {
        setProfile(null)
      }
      
      if (event !== 'INITIAL_SESSION') {
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ error: { message: string } | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (data.user) {
        setUser(data.user)
        await loadProfile(data.user.id)
      }
      return { error: error ? { message: mapErrorMessage(error.message) } : null }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return { error: { message: mapErrorMessage(message) } }
    }
  }

  const register = async (email: string, password: string, nome: string): Promise<{ error: { message: string } | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      })
      if (data.user) {
        setUser(data.user)
        await loadProfile(data.user.id)
      }
      return { error: error ? { message: mapErrorMessage(error.message) } : null }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return { error: { message: mapErrorMessage(message) } }
    }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: { message: string } | null }> => {
    if (!user) return { error: { message: 'No user logged in' } }
    
    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', user.id)
    
    if (!error) {
      await loadProfile(user.id)
    }
    
    return { error: error ? { message: error.message } : null }
  }

  return (
    <SupabaseAuthContext.Provider value={{ user, profile, isLoading, login, register, logout, updateProfile }}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}
