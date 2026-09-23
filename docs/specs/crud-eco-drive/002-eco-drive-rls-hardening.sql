-- Executar somente após a aplicação com RPCs estar publicada e validada.
-- Remove escrita direta; leitura autenticada continua permitida.
begin;
drop policy if exists "Authenticated users can insert eco drive campaigns" on public.eco_drive_campaigns;
drop policy if exists "Authenticated users can update eco drive campaigns" on public.eco_drive_campaigns;
drop policy if exists "Authenticated users can delete eco drive campaigns" on public.eco_drive_campaigns;
drop policy if exists "Authenticated users can insert eco drive materials" on public.eco_drive_materials;
drop policy if exists "Authenticated users can update eco drive materials" on public.eco_drive_materials;
drop policy if exists "Authenticated users can delete eco drive materials" on public.eco_drive_materials;
commit;

-- Reversão temporária, se a aplicação precisar voltar para a versão antiga:
-- create policy "Authenticated users can insert eco drive campaigns" on public.eco_drive_campaigns for insert to authenticated with check (true);
-- create policy "Authenticated users can update eco drive campaigns" on public.eco_drive_campaigns for update to authenticated using (true) with check (true);
-- create policy "Authenticated users can delete eco drive campaigns" on public.eco_drive_campaigns for delete to authenticated using (true);
-- create policy "Authenticated users can insert eco drive materials" on public.eco_drive_materials for insert to authenticated with check (true);
-- create policy "Authenticated users can update eco drive materials" on public.eco_drive_materials for update to authenticated using (true) with check (true);
-- create policy "Authenticated users can delete eco drive materials" on public.eco_drive_materials for delete to authenticated using (true);
