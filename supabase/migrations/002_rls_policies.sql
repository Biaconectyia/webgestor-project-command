-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_projetos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Usuários podem ver todos os usuários" ON usuarios
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Apenas admins podem criar/editar usuários" ON usuarios
  FOR ALL USING (auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin'));

-- Políticas para projetos
CREATE POLICY "Membros podem ver projetos onde participam" ON projetos
  FOR SELECT USING (
    auth.uid() IN (SELECT usuario_id FROM equipe_projetos WHERE projeto_id = projetos.id) OR
    auth.uid() = gerente_id OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin')
  );

CREATE POLICY "Apenas admins e gerentes podem criar projetos" ON projetos
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM usuarios WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY "Gerentes podem atualizar próprios projetos" ON projetos
  FOR UPDATE USING (
    auth.uid() = gerente_id OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin')
  );

-- Políticas para tarefas
CREATE POLICY "Responsáveis podem atualizar próprias tarefas" ON tarefas
  FOR UPDATE USING (auth.uid() = responsavel_id);

CREATE POLICY "Membros podem ver tarefas de projetos onde participam" ON tarefas
  FOR SELECT USING (
    auth.uid() IN (SELECT usuario_id FROM equipe_projetos WHERE projeto_id = tarefas.projeto_id) OR
    auth.uid() = responsavel_id OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin')
  );

CREATE POLICY "Apenas admins e gerentes podem criar tarefas" ON tarefas
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT usuario_id FROM equipe_projetos WHERE projeto_id = tarefas.projeto_id) OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role IN ('admin', 'manager'))
  );

-- Políticas para equipe_projetos
CREATE POLICY "Membros podem ver equipe dos projetos onde participam" ON equipe_projetos
  FOR SELECT USING (
    auth.uid() IN (SELECT usuario_id FROM equipe_projetos ep WHERE ep.projeto_id = equipe_projetos.projeto_id) OR
    auth.uid() IN (SELECT gerente_id FROM projetos WHERE id = equipe_projetos.projeto_id) OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin')
  );

CREATE POLICY "Apenas admins e gerentes podem gerenciar equipe" ON equipe_projetos
  FOR ALL USING (
    auth.uid() IN (SELECT gerente_id FROM projetos WHERE id = equipe_projetos.projeto_id) OR
    auth.uid() IN (SELECT id FROM usuarios WHERE role = 'admin')
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON projetos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil ao se registrar
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (id, email, nome, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome', 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();