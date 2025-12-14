import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
const SEED_ADMIN_EMAIL = import.meta.env.VITE_SEED_ADMIN_EMAIL
const SEED_ADMIN_PASSWORD = import.meta.env.VITE_SEED_ADMIN_PASSWORD
const SEED_ADMIN_NAME = import.meta.env.VITE_SEED_ADMIN_NAME || 'Admin'

interface AuthContextType {
  user: User | null
  profile: any | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error: any }>
  register: (email: string, password: string, nome: string) => Promise<{ error: any }>
  logout: () => Promise<void>
  updateProfile: (updates: any) => Promise<{ error: any }>
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const envMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  const mapErrorMessage = (msg?: string) => {
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

  useEffect(() => {
    let mounted = true

    // Initialize session check
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user)
            await loadProfile(session.user.id)
          } else {
             // Seed logic
             const seededFlag = localStorage.getItem('webgestor_seed_admin_done')
             if (!seededFlag && SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
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
          setInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      // Update user state
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Only load profile if user changed or we don't have profile yet
        if (user?.id !== currentUser.id) {
           await loadProfile(currentUser.id)
        }
      } else {
        setProfile(null)
      }
      
      // Ensure loading is false after any auth change event (except initial which is handled above)
      if (event !== 'INITIAL_SESSION') {
         setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Fallback: se perfil não existe (erro PGRST116 ou tabela vazia para o ID), tenta criar
        // Isso resolve casos onde o trigger falhou ou não existe
        if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
          console.warn('Perfil não encontrado, tentando criar manualmente...')
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
             const newProfile = {
                id: userId,
                email: userData.user.email,
                nome: userData.user.user_metadata?.nome || 'Usuário',
                // role: 'member' // Deixa o banco definir o padrão para segurança
             }
             const { error: insertError } = await supabase.from('usuarios').insert([newProfile])
             if (!insertError) {
                setProfile(newProfile)
                return
             }
          }
        }
        throw error
      }
      setProfile(data)
      // Auto-promote seed admin account
      try {
        if (data?.email === SEED_ADMIN_EMAIL && data?.role !== 'admin') {
          const { error: promoteError } = await supabase
            .from('usuarios')
            .update({ role: 'admin', nome: SEED_ADMIN_NAME })
            .eq('id', userId)
          if (!promoteError) {
            const { data: refreshed } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', userId)
              .single()
            setProfile(refreshed)
          }
        }
      } catch {}
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      // Removido setIsLoading(false) daqui para evitar conflito com onAuthStateChange
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (data.user) {
        setUser(data.user)
        await loadProfile(data.user.id)
      }
      return { error: error ? { message: mapErrorMessage(error.message) } : null }
    } catch (e: any) {
      return { error: { message: mapErrorMessage(e?.message) } }
    }
  }

  const register = async (email: string, password: string, nome: string) => {
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
      if (error) {
        console.error('Signup error:', error.message)
      }
      return { error: error ? { message: mapErrorMessage(error.message) } : null }
    } catch (e: any) {
      return { error: { message: mapErrorMessage(e?.message) } }
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return error
  }

  const updateProfile = async (updates: any) => {
    if (!user) return { error: { message: 'No user logged in' } }
    
    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', user.id)
    
    if (!error) {
      await loadProfile(user.id)
    }
    
    return { error }
  }

  const value = {
    user,
    profile,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
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
