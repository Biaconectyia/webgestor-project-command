import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function diagnose() {
  console.log('--- Diagnóstico do Banco de Dados Supabase ---')

  // 1. Verificar conexão e existência da tabela usuarios
  console.log('\n1. Verificando tabela "usuarios"...')
  const { data: users, error: usersError } = await supabase
    .from('usuarios')
    .select('count', { count: 'exact', head: true })
  
  if (usersError) {
    console.error('❌ Erro ao acessar tabela "usuarios":', usersError.message)
    if (usersError.code === '42P01') {
      console.error('   -> A tabela não existe.')
    }
  } else {
    console.log('✅ Tabela "usuarios" acessível.')
  }

  // 2. Verificar tabela projetos
  console.log('\n2. Verificando tabela "projetos"...')
  const { error: projError } = await supabase
    .from('projetos')
    .select('count', { count: 'exact', head: true })

  if (projError) {
    console.error('❌ Erro ao acessar tabela "projetos":', projError.message)
  } else {
    console.log('✅ Tabela "projetos" acessível.')
  }

  // 3. Testar inserção de usuário (simulação)
  // Não podemos ver triggers diretamente via API client padrão, mas podemos testar o efeito.
  console.log('\n3. Verificando Trigger de perfil...')
  const testEmail = `diag_${Date.now()}@test.com`
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: { data: { nome: 'Diagnostico User' } }
  })

  if (authError) {
    console.error('❌ Erro ao criar usuário de teste:', authError.message)
  } else if (authData.user) {
    console.log('✅ Usuário de teste criado na Auth:', authData.user.id)
    
    // Aguardar trigger
    await new Promise(r => setTimeout(r, 2000))

    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Perfil não criado na tabela "usuarios". O Trigger provavelmente não existe ou falhou.')
      if (profileError) console.error('   Erro:', profileError.message)
    } else {
      console.log('✅ Trigger funcionou! Perfil criado:', profile.nome)
    }

    // Limpeza
    await supabase.auth.admin.deleteUser(authData.user.id)
    console.log('   (Usuário de teste removido)')
  }

  console.log('\n--- Fim do Diagnóstico ---')
}

diagnose().catch(console.error)
