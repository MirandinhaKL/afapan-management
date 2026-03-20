-- Script SQL para configurar tabelas no Supabase
-- Execute este script no SQL Editor do painel Supabase

-- Habilitar UUID extension (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfis de Usuários (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'gestor', 'voluntario')) DEFAULT 'voluntario',
  ativo BOOLEAN DEFAULT true,
  criadoEm TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participantes
CREATE TABLE IF NOT EXISTS participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  turma TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registros de Baldes
CREATE TABLE IF NOT EXISTS baldes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  trimestre TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  data_registro DATE DEFAULT CURRENT_DATE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE baldes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para participantes (todos os usuários autenticados podem acessar)
CREATE POLICY "Authenticated users can view participantes" ON participantes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert participantes" ON participantes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update participantes" ON participantes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete participantes" ON participantes
  FOR DELETE TO authenticated USING (true);

-- Políticas RLS para baldes (todos os usuários autenticados podem acessar)
CREATE POLICY "Authenticated users can view baldes" ON baldes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert baldes" ON baldes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update baldes" ON baldes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete baldes" ON baldes
  FOR DELETE TO authenticated USING (true);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'voluntario'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at (opcional)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.criado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at nas tabelas
CREATE TRIGGER handle_updated_at_participantes
  BEFORE UPDATE ON participantes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_baldes
  BEFORE UPDATE ON baldes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();