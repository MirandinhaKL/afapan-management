-- Migration: Fix criado_em trigger causing update errors
-- Error: "record "new" has no field "criado_em"" (code 42703)
-- 
-- The old trigger was incorrectly trying to set criado_em on UPDATE operations.
-- This migration:
-- 1. Drops the problematic trigger
-- 2. Adds atualizado_em column to track updates
-- 3. Creates a new trigger that correctly updates atualizado_em

-- Drop old problematic triggers
DROP TRIGGER IF EXISTS handle_updated_at_participantes ON participantes;
DROP TRIGGER IF EXISTS handle_updated_at_baldes ON baldes;

-- Drop old problematic function
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Add atualizado_em column if it doesn't exist
ALTER TABLE IF EXISTS participantes
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE IF EXISTS baldes
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE IF EXISTS turmas
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE IF EXISTS participantes_turmas
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create new function that correctly updates atualizado_em
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers for participantes
CREATE TRIGGER handle_updated_at_participantes
  BEFORE UPDATE ON participantes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create new triggers for baldes
CREATE TRIGGER handle_updated_at_baldes
  BEFORE UPDATE ON baldes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create new triggers for turmas
CREATE TRIGGER handle_updated_at_turmas
  BEFORE UPDATE ON turmas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create new triggers for participantes_turmas
CREATE TRIGGER handle_updated_at_participantes_turmas
  BEFORE UPDATE ON participantes_turmas
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
