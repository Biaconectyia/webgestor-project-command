import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, LayoutGrid } from 'lucide-react'

export default function SupabaseAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  
  const { login, register } = useSupabaseAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const envMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const { error } = await login(loginEmail, loginPassword)
    
    if (!error) {
      toast({ title: 'Login realizado com sucesso!' })
      navigate('/dashboard')
    } else {
      toast({ title: 'Erro no login', description: error.message, variant: 'destructive' })
    }
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (!registerName.trim()) {
      toast({ 
        title: 'Nome obrigatório', 
        description: 'Por favor, informe seu nome',
        variant: 'destructive' 
      })
      setIsLoading(false)
      return
    }

    if (!registerEmail.includes('@') || registerEmail.length < 5) {
      toast({ 
        title: 'Email inválido', 
        description: 'Por favor, informe um email válido',
        variant: 'destructive' 
      })
      setIsLoading(false)
      return
    }

    if (registerPassword.length < 6) {
      toast({ 
        title: 'Senha fraca', 
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive' 
      })
      setIsLoading(false)
      return
    }
    
    const { error } = await register(registerEmail, registerPassword, registerName)
    
    if (!error) {
      toast({ title: 'Conta criada com sucesso!' })
      navigate('/dashboard')
    } else {
      toast({ 
        title: 'Erro no cadastro', 
        description: error.message,
        variant: 'destructive' 
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {envMissing && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-900 text-sm">
            Supabase não configurado. Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> em <code>.env.local</code>.
          </div>
        )}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">WebGestor</h1>
        </div>
        
        <Card className="shadow-lg border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Bem-vindo</CardTitle>
            <CardDescription>
              Sistema de gestão de projetos e equipes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Seu nome"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
