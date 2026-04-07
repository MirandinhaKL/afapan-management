-- Desabilitar RLS temporariamente para permitir operações
ALTER TABLE IF EXISTS participantes_turmas DISABLE ROW LEVEL SECURITY;

-- Ou, se preferir manter RLS, remova as políticas antigas e recrie
drop policy if exists "Authenticated users can insert participantes_turmas" on participantes_turmas;
drop policy if exists "Authenticated users can view participantes_turmas" on participantes_turmas;
drop policy if exists "Authenticated users can update participantes_turmas" on participantes_turmas;
drop policy if exists "Authenticated users can delete participantes_turmas" on participantes_turmas;

-- Recriar as políticas com permissões amplas
CREATE POLICY "Authenticated users can view participantes_turmas" ON participantes_turmas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert participantes_turmas" ON participantes_turmas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update participantes_turmas" ON participantes_turmas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete participantes_turmas" ON participantes_turmas
  FOR DELETE TO authenticated USING (true);

-- Habilitar RLS novamente se desabilitado
ALTER TABLE IF EXISTS participantes_turmas ENABLE ROW LEVEL SECURITY;
