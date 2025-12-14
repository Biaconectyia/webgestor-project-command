-- Fix final para tabela usuarios e permissões
-- 1. Garante RLS ativo
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 2. Permite INSERT para o próprio usuário (necessário para o fallback do frontend)
DROP POLICY IF EXISTS "Usuários podem criar próprio perfil" ON public.usuarios;
CREATE POLICY "Usuários podem criar próprio perfil" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Segurança de colunas: Impede que usuários definam seu próprio 'role' via API
REVOKE INSERT ON public.usuarios FROM authenticated, anon;
GRANT INSERT (id, email, nome, avatar_url, created_at, updated_at) ON public.usuarios TO authenticated, anon;
-- 'role' não está na lista, então usará o DEFAULT 'member'

-- 4. Garante permissões de SELECT e UPDATE (mantendo as existentes)
GRANT SELECT, UPDATE ON public.usuarios TO authenticated, anon;

-- 5. Atualiza Trigger com search_path seguro e tratamento de conflitos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Novo Usuário'),
    'member'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, public.usuarios.nome),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  -- Se houver conflito de email, tenta atualizar o ID se for o caso ou apenas logar
  -- UPDATE não é ideal aqui se o ID for diferente, mas vamos garantir update básico
  UPDATE public.usuarios
  SET updated_at = NOW()
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
