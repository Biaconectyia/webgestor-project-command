-- Tabela de usuários (extende auth.users do Supabase)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  gerente_id UUID REFERENCES usuarios(id),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'cancelado')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  responsavel_id UUID REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta')),
  prazo DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento equipe-projetos
CREATE TABLE equipe_projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  papel VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, projeto_id)
);

-- Índices para performance
CREATE INDEX idx_projetos_gerente ON projetos(gerente_id);
CREATE INDEX idx_projetos_status ON projetos(status);
CREATE INDEX idx_tarefas_projeto ON tarefas(projeto_id);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_equipe_projetos_usuario ON equipe_projetos(usuario_id);
CREATE INDEX idx_equipe_projetos_projeto ON equipe_projetos(projeto_id);

-- Permissões básicas para anon e authenticated
GRANT SELECT ON usuarios TO anon;
GRANT ALL ON usuarios TO authenticated;
GRANT SELECT ON projetos TO anon;
GRANT ALL ON projetos TO authenticated;
GRANT SELECT ON tarefas TO anon;
GRANT ALL ON tarefas TO authenticated;
GRANT SELECT ON equipe_projetos TO anon;
GRANT ALL ON equipe_projetos TO authenticated;