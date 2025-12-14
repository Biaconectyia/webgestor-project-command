import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Erro: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1]
const passwordArg = args.find(a => a.startsWith('--password='))?.split('=')[1]
const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1] || 'Admin'

if (!emailArg || !passwordArg) {
  console.error('Uso: tsx scripts/provision-admin.ts --email=<email> --password=<senha> --name=<nome>')
  process.exit(1)
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON)

async function ensureAdmin() {
  const email = emailArg!
  const password = passwordArg!

  const existing = await client
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (existing.error) {
    console.error('Erro ao consultar usuários:', existing.error.message)
    process.exit(1)
  }

  if (existing.data) {
    console.log('Usuário já existe, tentando promover via sessão do próprio usuário...')
  }

  const signup = await client.auth.signUp({
    email,
    password,
    options: { data: { nome: nameArg } },
  })

  if (signup.error) {
    console.error('Erro no cadastro:', signup.error.message)
    process.exit(1)
  }

  const userId = signup.data.user?.id
  if (!userId) {
    console.error('Cadastro realizado sem ID de usuário disponível.')
    process.exit(1)
  }

  // Aguarda perfil ser criado via trigger (pequeno delay)
  await new Promise(res => setTimeout(res, 1500))

  const promote = await client
    .from('usuarios')
    .update({ role: 'admin', nome: nameArg })
    .eq('id', userId)

  if (promote.error) {
    console.error('Erro ao promover perfil:', promote.error.message)
    process.exit(1)
  }

  console.log('Admin cadastrado e promovido com sucesso:', email)
}

ensureAdmin().then(() => process.exit(0))
