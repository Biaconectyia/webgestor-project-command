-- Corrige erro "Database error saving new user" no signup
-- Causa provável: violação de UNIQUE em public.usuarios.email dentro do trigger
-- Solução: UPSERT por id e resolução de conflito por email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tenta UPSERT por id
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
  -- Conflito por email: faz merge do registro existente com o novo id
  UPDATE public.usuarios
  SET id = NEW.id,
      email = NEW.email,
      nome = COALESCE(NEW.raw_user_meta_data->>'nome', nome),
      updated_at = NOW()
  WHERE email = NEW.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante trigger ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
