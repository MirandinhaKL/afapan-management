ALTER TABLE turma_bucket_periods
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

UPDATE turma_bucket_periods
SET
  data_inicio = COALESCE(data_inicio, data_monitoramento),
  data_fim = COALESCE(data_fim, data_monitoramento)
WHERE data_inicio IS NULL OR data_fim IS NULL;

ALTER TABLE turma_bucket_periods
DROP CONSTRAINT IF EXISTS turma_bucket_periods_intervalo_valido;

ALTER TABLE turma_bucket_periods
ADD CONSTRAINT turma_bucket_periods_intervalo_valido
CHECK (data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio);
