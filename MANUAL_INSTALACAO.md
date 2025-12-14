# WebGestor - Manual de Instalação e Configuração

## 📋 Visão Geral

WebGestor é um sistema completo de gerenciamento empresarial com autenticação via Supabase, focado em organização de equipes, projetos e tarefas.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (BaaS - Backend as a Service)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth com JWT
- **Estado**: React Query + Zustand
- **UI**: Tailwind CSS + Radix UI + shadcn/ui
- **Testes**: Vitest + React Testing Library

## 📦 Pré-requisitos

- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase (gratuito)
- Git

## 🔧 Instalação Passo a Passo

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/webgestor.git
cd webgestor
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Configure:
   - **Name**: WebGestor
   - **Database Password**: Use uma senha forte
   - **Region**: Escolha a mais próxima

#### 3.2 Obtenha as Credenciais

1. Vá para **Settings** → **API**
2. Copie:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

### 4. Configure as Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
```

### 5. Configure o Banco de Dados

#### 5.1 Execute as Migrations

As migrations estão em `supabase/migrations/`. Você pode:

**Opção A: Via Interface Web**
1. Acesse o dashboard do seu projeto Supabase
2. Vá para **SQL Editor**
3. Execute o conteúdo dos arquivos:
   - `001_create_tables.sql`
   - `002_rls_policies.sql`

**Opção B: Via CLI (Recomendado)**
```bash
npm run supabase:migrate
```

#### 5.2 Verifique as Tabelas

Após executar as migrations, você terá:

- `usuarios` - Perfil dos usuários
- `projetos` - Projetos da empresa  
- `tarefas` - Tarefas dos projetos
- `equipe_projetos` - Relação usuário-projeto

### 6. Teste a Instalação

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Execute os testes
npm test

# Verifique linting
npm run lint
```

Acesse: [http://localhost:8080](http://localhost:8080)

## 🔐 Configuração de Segurança

### Row Level Security (RLS)

As políticas de segurança já estão configuradas nas migrations:

- **Usuários**: Podem ver todos, mas só atualizar próprio perfil
- **Projetos**: Visíveis apenas para membros da equipe
- **Tarefas**: Responsáveis podem atualizar, todos podem visualizar se fizerem parte do projeto

### Permissões por Função

| Função | Permissões |
|--------|------------|
| Admin | Acesso total |
| Manager | Gerenciar projetos e tarefas |
| Member | Visualizar e atualizar próprias tarefas |

## 🧪 Executando Testes

```bash
# Testes unitários
npm test

# Testes com interface visual
npm run test:ui

# Cobertura de testes
npm run test:coverage
```

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI (shadcn/ui)
│   ├── layout/         # Layout principal
│   └── *.tsx           # Componentes de páginas
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
├── types/              # Tipos TypeScript
└── tests/              # Testes

supabase/
└── migrations/         # Migrations do banco de dados
```

## 🔧 Configuração de Produção

### 1. Build de Produção

```bash
npm run build
```

### 2. Deploy no Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### 3. Deploy no Netlify

1. Conecte seu repositório
2. Configure build command: `npm run build`
3. Configure publish directory: `dist`
4. Adicione variáveis de ambiente

## 🚨 Troubleshooting

### Erro: "Missing Supabase environment variables"

**Solução**: Verifique se o arquivo `.env` existe e contém as variáveis corretas.

### Erro: "Permission denied for table..."

**Solução**: As políticas RLS não foram aplicadas. Execute as migrations novamente.

### Erro: "Failed to fetch"

**Solução**: Verifique:
- URL do Supabase está correta
- Chave anon está correta  
- CORS está configurado no Supabase

### Erro: "User not found after registration"

**Solução**: A função `handle_new_user()` não foi criada. Execute a migration `002_rls_policies.sql`.

## 📞 Suporte

Para problemas técnicos:

1. Verifique os logs no console do navegador
2. Confira os logs do Supabase em **Logs** no dashboard
3. Execute os testes para identificar problemas
4. Abra uma issue no repositório

## 🔗 Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.