-- Script para criar apenas a tabela de períodos de monitoramento
-- Execute isto no SQL Editor do Supabase se a tabela não existir

CREATE TABLE IF NOT EXISTS turma_bucket_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  periodo_numero INTEGER NOT NULL CHECK (periodo_numero >= 1 AND periodo_numero <= 4),
  periodo_label TEXT NOT NULL,
  data_monitoramento DATE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(turma_id, periodo_numero)
);

-- Atualizar tabela baldes para incluir referências ao período e turma
ALTER TABLE baldes ADD COLUMN IF NOT EXISTS turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE;
ALTER TABLE baldes ADD COLUMN IF NOT EXISTS turma_bucket_period_id UUID REFERENCES turma_bucket_periods(id) ON DELETE SET NULL;

-- Habilitar RLS na tabela
ALTER TABLE turma_bucket_periods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para turma_bucket_periods
CREATE POLICY "Authenticated users can view turma_bucket_periods" ON turma_bucket_periods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert turma_bucket_periods" ON turma_bucket_periods
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update turma_bucket_periods" ON turma_bucket_periods
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete turma_bucket_periods" ON turma_bucket_periods
  FOR DELETE TO authenticated USING (true);

-- Verificar se as colunas foram adicionadas em baldes
-- Se receber erro sobre RLS, execute:
-- ALTER TABLE baldes DISABLE ROW LEVEL SECURITY;

-- Confirma que tudo foi criado
SELECT 
  table_name, 
  string_agg(column_name, ', ') as columns
FROM information_schema.columns 
WHERE table_name IN ('turma_bucket_periods', 'baldes')
GROUP BY table_name;
