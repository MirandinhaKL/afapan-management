-- Script para verificar e corrigir a tabela turma_bucket_periods

-- 1. Primeiro, verifique se a tabela existe e quais são suas colunas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turma_bucket_periods' 
ORDER BY ordinal_position;

-- 2. Se a tabela não tem as colunas corretas, recrie-a
-- Desabilitar RLS temporariamente
ALTER TABLE turma_bucket_periods DISABLE ROW LEVEL SECURITY;

-- 3. Dropar e recriar a tabela (se necessário)
-- IMPORTANTE: Só execute isto se a tabela estiver com problemas
-- DROP TABLE IF EXISTS turma_bucket_periods CASCADE;

-- 4. Se a tabela está vazia e correta, apenas reabilite RLS
ALTER TABLE turma_bucket_periods ENABLE ROW LEVEL SECURITY;

-- 5. Remover as políticas antigas (ignore erros se não existirem)
DROP POLICY IF EXISTS "allow_all" ON turma_bucket_periods;
DROP POLICY IF EXISTS "Authenticated users can view turma_bucket_periods" ON turma_bucket_periods;
DROP POLICY IF EXISTS "Authenticated users can insert turma_bucket_periods" ON turma_bucket_periods;
DROP POLICY IF EXISTS "Authenticated users can update turma_bucket_periods" ON turma_bucket_periods;
DROP POLICY IF EXISTS "Authenticated users can delete turma_bucket_periods" ON turma_bucket_periods;

-- 6. Criar política única e simples
CREATE POLICY "turma_bucket_periods_all_access" ON turma_bucket_periods
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Verificar novamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'turma_bucket_periods' 
ORDER BY ordinal_position;
