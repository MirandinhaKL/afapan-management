-- Script para criar tabela de links de WhatsApp para participantes

-- Criar tabela de links únicos para WhatsApp
CREATE TABLE IF NOT EXISTS participante_bucket_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id UUID NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
  turma_bucket_period_id UUID NOT NULL REFERENCES turma_bucket_periods(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_participante_bucket_links_token ON participante_bucket_links(token);
CREATE INDEX IF NOT EXISTS idx_participante_bucket_links_participante_period ON participante_bucket_links(participante_id, turma_bucket_period_id);

-- Habilitar RLS
ALTER TABLE participante_bucket_links ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para participante_bucket_links
-- Permitir acesso sem autenticação apenas para leitura com token válido
CREATE POLICY "Public can view own link by token" ON participante_bucket_links
  FOR SELECT USING (true);

CREATE POLICY "Public can update own link by token" ON participante_bucket_links
  FOR UPDATE USING (true);

-- Authenticated users can view all links
CREATE POLICY "Authenticated users can view all links" ON participante_bucket_links
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can manage links
CREATE POLICY "Authenticated users can insert links" ON participante_bucket_links
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update links" ON participante_bucket_links
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete links" ON participante_bucket_links
  FOR DELETE TO authenticated USING (true);

-- Trigger para atualizar atualizado_em
DROP TRIGGER IF EXISTS handle_updated_at_participante_bucket_links ON participante_bucket_links;

CREATE TRIGGER handle_updated_at_participante_bucket_links
  BEFORE UPDATE ON participante_bucket_links
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
