import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Erro: defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const args = process.argv.slice(2)
const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1]
const passwordArg = args.find(a => a.startsWith('--password='))?.split('=')[1]
const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1] || 'Admin'

if (!emailArg) {
  console.error('Uso: tsx scripts/promote-admin.ts --email=<email> [--password=<senha>] [--name=<nome>]')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function promoteAdmin() {
  const email = emailArg!
  const password = passwordArg
  const nome = nameArg

  // 1) Tenta achar perfil existente
  const { data: existingProfile, error: profileErr } = await admin
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (profileErr) {
    console.warn('Aviso ao consultar perfil:', profileErr.message)
  }

  let userId = existingProfile?.id

  // 2) Se não há perfil, tenta localizar usuário na Auth
  if (!userId) {
    const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listErr) {
      console.error('Erro ao listar usuários na Auth:', listErr.message)
      process.exit(1)
    }
    const found = usersList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    userId = found?.id

    // 3) Se não existe na Auth, cria usuário admin
    if (!userId) {
      if (!password) {
        console.error('Senha obrigatória para criar usuário inexistente na Auth. Use --password=...')
        process.exit(1)
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome }
      })
      if (createErr) {
        console.error('Erro ao criar usuário na Auth:', createErr.message)
        process.exit(1)
      }
      userId = created.user?.id || undefined
    }
  }

  if (!userId) {
    console.error('Não foi possível obter o ID do usuário')
    process.exit(1)
  }

  // 4) Garante perfil na tabela usuarios com UPSERT
  const { error: upsertErr } = await admin
    .from('usuarios')
    .upsert({ id: userId, email, nome, role: 'admin' }, { onConflict: 'email' })
  if (upsertErr) {
    console.error('Erro ao upsert perfil:', upsertErr.message)
    process.exit(1)
  }

  console.log(`Usuário ${email} promovido para admin com sucesso (id=${userId})`)
}

promoteAdmin().catch(err => {
  console.error('Falha ao promover admin:', err?.message || err)
  process.exit(1)
})
