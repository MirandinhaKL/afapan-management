-- Estrutura inicial do módulo Eco Drive.
-- Execute este arquivo no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS eco_drive_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  data_evento DATE NOT NULL,
  local TEXT NOT NULL,
  numero_voluntarios INTEGER NOT NULL DEFAULT 0 CHECK (numero_voluntarios >= 0),
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'concluida')),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eco_drive_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID NOT NULL REFERENCES eco_drive_campaigns(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (
    tipo IN (
      'tampinhas',
      'cartelas_remedios',
      'esponjas',
      'embalagens_pet',
      'embalagens_laminadas',
      'isopor',
      'outros'
    )
  ),
  quantidade NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  unidade TEXT NOT NULL CHECK (unidade IN ('kg', 'unidade')),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (campanha_id, tipo)
);

-- Compatibilidade para quem criou a tabela com "numero_participantes".
ALTER TABLE eco_drive_campaigns
  ADD COLUMN IF NOT EXISTS numero_voluntarios INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'eco_drive_campaigns'
      AND column_name = 'numero_participantes'
  ) THEN
    EXECUTE 'UPDATE eco_drive_campaigns SET numero_voluntarios = numero_participantes WHERE numero_voluntarios = 0';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eco_drive_campaigns_numero_voluntarios_check'
  ) THEN
    ALTER TABLE eco_drive_campaigns
      ADD CONSTRAINT eco_drive_campaigns_numero_voluntarios_check CHECK (numero_voluntarios >= 0);
  END IF;
END $$;

-- Compatibilidade para quem executou uma versão anterior deste script.
ALTER TABLE eco_drive_materials
  ADD COLUMN IF NOT EXISTS quantidade NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE eco_drive_materials
  ADD COLUMN IF NOT EXISTS unidade TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'eco_drive_materials'
      AND column_name = 'quantidade_kg'
  ) THEN
    EXECUTE 'UPDATE eco_drive_materials SET quantidade = quantidade_kg WHERE quantidade = 0';
  END IF;
END $$;

UPDATE eco_drive_materials
SET unidade = CASE WHEN tipo = 'esponjas' THEN 'unidade' ELSE 'kg' END
WHERE unidade IS NULL;

ALTER TABLE eco_drive_materials ALTER COLUMN unidade SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eco_drive_materials_quantidade_check'
  ) THEN
    ALTER TABLE eco_drive_materials
      ADD CONSTRAINT eco_drive_materials_quantidade_check CHECK (quantidade >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'eco_drive_materials_unidade_check'
  ) THEN
    ALTER TABLE eco_drive_materials
      ADD CONSTRAINT eco_drive_materials_unidade_check CHECK (unidade IN ('kg', 'unidade'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_eco_drive_campaigns_data_evento
  ON eco_drive_campaigns (data_evento DESC);

CREATE INDEX IF NOT EXISTS idx_eco_drive_materials_campanha
  ON eco_drive_materials (campanha_id);

ALTER TABLE eco_drive_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_drive_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view eco drive campaigns" ON eco_drive_campaigns;
CREATE POLICY "Authenticated users can view eco drive campaigns" ON eco_drive_campaigns
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert eco drive campaigns" ON eco_drive_campaigns;
CREATE POLICY "Authenticated users can insert eco drive campaigns" ON eco_drive_campaigns
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update eco drive campaigns" ON eco_drive_campaigns;
CREATE POLICY "Authenticated users can update eco drive campaigns" ON eco_drive_campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete eco drive campaigns" ON eco_drive_campaigns;
CREATE POLICY "Authenticated users can delete eco drive campaigns" ON eco_drive_campaigns
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view eco drive materials" ON eco_drive_materials;
CREATE POLICY "Authenticated users can view eco drive materials" ON eco_drive_materials
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert eco drive materials" ON eco_drive_materials;
CREATE POLICY "Authenticated users can insert eco drive materials" ON eco_drive_materials
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update eco drive materials" ON eco_drive_materials;
CREATE POLICY "Authenticated users can update eco drive materials" ON eco_drive_materials
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete eco drive materials" ON eco_drive_materials;
CREATE POLICY "Authenticated users can delete eco drive materials" ON eco_drive_materials
  FOR DELETE TO authenticated USING (true);
