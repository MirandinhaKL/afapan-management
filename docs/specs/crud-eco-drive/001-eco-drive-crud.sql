-- Migração aditiva do CRUD Eco Drive.
-- Aplicar antes da publicação da aplicação. Não remove as políticas antigas.

begin;

alter table public.eco_drive_campaigns alter column local drop not null;
alter table public.eco_drive_campaigns add column if not exists arquivado_em timestamptz;
alter table public.eco_drive_campaigns add column if not exists arquivado_por uuid references auth.users(id) on delete set null;

create index if not exists idx_eco_drive_campaigns_arquivado_data
  on public.eco_drive_campaigns (arquivado_em, data_evento desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'eco_drive_materials_precision_check') then
    alter table public.eco_drive_materials
      add constraint eco_drive_materials_precision_check
      check (
        (unidade = 'kg' and quantidade = round(quantidade, 1))
        or (unidade = 'unidade' and quantidade = trunc(quantidade))
      ) not valid;
  end if;
end $$;

create table if not exists public.eco_drive_audit_log (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references public.eco_drive_campaigns(id) on delete restrict,
  entidade text not null check (entidade in ('campanha', 'material')),
  entidade_id uuid not null,
  acao text not null check (acao in ('criar', 'editar', 'arquivar', 'restaurar')),
  usuario_id uuid references auth.users(id) on delete set null,
  valores_anteriores jsonb,
  valores_novos jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists idx_eco_drive_audit_campanha_data
  on public.eco_drive_audit_log (campanha_id, criado_em desc);

alter table public.eco_drive_audit_log enable row level security;
drop policy if exists "Authenticated users can view eco drive audit" on public.eco_drive_audit_log;
create policy "Authenticated users can view eco drive audit"
  on public.eco_drive_audit_log for select to authenticated using (true);

create or replace function public.eco_drive_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists eco_drive_campaigns_touch_updated_at on public.eco_drive_campaigns;
create trigger eco_drive_campaigns_touch_updated_at
before update on public.eco_drive_campaigns
for each row execute function public.eco_drive_touch_updated_at();

drop trigger if exists eco_drive_materials_touch_updated_at on public.eco_drive_materials;
create trigger eco_drive_materials_touch_updated_at
before update on public.eco_drive_materials
for each row execute function public.eco_drive_touch_updated_at();

create or replace function public.eco_drive_write_audit()
returns trigger security definer language plpgsql set search_path = '' as $$
declare
  v_campaign_id uuid;
  v_entity text;
  v_entity_id uuid;
  v_action text;
begin
  if tg_table_name = 'eco_drive_campaigns' then
    v_entity := 'campanha';
    v_campaign_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_entity_id := v_campaign_id;
  else
    v_entity := 'material';
    v_campaign_id := case when tg_op = 'DELETE' then old.campanha_id else new.campanha_id end;
    v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'criar';
  elsif v_entity = 'campanha' then
    if old.arquivado_em is null and new.arquivado_em is not null then
      v_action := 'arquivar';
    elsif old.arquivado_em is not null and new.arquivado_em is null then
      v_action := 'restaurar';
    else
      v_action := 'editar';
    end if;
  else
    v_action := 'editar';
  end if;

  insert into public.eco_drive_audit_log (
    campanha_id, entidade, entidade_id, acao, usuario_id,
    valores_anteriores, valores_novos
  ) values (
    v_campaign_id, v_entity, v_entity_id, v_action, auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists eco_drive_campaigns_audit on public.eco_drive_campaigns;
create trigger eco_drive_campaigns_audit
after insert or update on public.eco_drive_campaigns
for each row execute function public.eco_drive_write_audit();

drop trigger if exists eco_drive_materials_audit on public.eco_drive_materials;
create trigger eco_drive_materials_audit
after insert or update on public.eco_drive_materials
for each row execute function public.eco_drive_write_audit();

create or replace function public.eco_drive_assert_input(
  p_name text, p_date date, p_volunteers integer, p_materials jsonb
) returns void language plpgsql immutable set search_path = '' as $$
declare
  v_count integer;
begin
  if nullif(btrim(p_name), '') is null then raise exception 'Nome da campanha é obrigatório.' using errcode = '22023'; end if;
  if p_date is null then raise exception 'Data do evento é obrigatória.' using errcode = '22023'; end if;
  if p_volunteers is null or p_volunteers < 0 then raise exception 'Número de voluntários inválido.' using errcode = '22023'; end if;
  if jsonb_typeof(p_materials) <> 'array' then raise exception 'Materiais inválidos.' using errcode = '22023'; end if;

  select count(distinct item->>'type') into v_count from jsonb_array_elements(p_materials) item;
  if jsonb_array_length(p_materials) <> 7 or v_count <> 7 then
    raise exception 'Informe exatamente os sete materiais.' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_materials) item
    where item->>'type' not in ('tampinhas','cartelas_remedios','esponjas','embalagens_pet','embalagens_laminadas','isopor','outros')
       or (item->>'quantity')::numeric < 0
       or ((item->>'unit') = 'kg' and (item->>'quantity')::numeric <> round((item->>'quantity')::numeric, 1))
       or ((item->>'unit') = 'unidade' and (item->>'quantity')::numeric <> trunc((item->>'quantity')::numeric))
       or ((item->>'type') = 'esponjas') <> ((item->>'unit') = 'unidade')
  ) then raise exception 'Quantidade ou unidade de material inválida.' using errcode = '22023'; end if;
end;
$$;

create or replace function public.create_eco_drive_campaign(
  p_name text, p_event_date date, p_location text, p_volunteer_count integer,
  p_status text, p_notes text, p_materials jsonb
) returns uuid security definer language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória.' using errcode = '42501'; end if;
  if p_status not in ('planejada','concluida') then raise exception 'Status inválido.' using errcode = '22023'; end if;
  perform public.eco_drive_assert_input(p_name, p_event_date, p_volunteer_count, p_materials);
  insert into public.eco_drive_campaigns (nome,data_evento,local,numero_voluntarios,status,observacoes)
  values (btrim(p_name),p_event_date,nullif(btrim(p_location),''),p_volunteer_count,p_status,nullif(btrim(p_notes),''))
  returning id into v_id;
  insert into public.eco_drive_materials (campanha_id,tipo,quantidade,unidade)
  select v_id, item->>'type', (item->>'quantity')::numeric, item->>'unit'
  from jsonb_array_elements(p_materials) item;
  return v_id;
end;
$$;

create or replace function public.update_eco_drive_campaign(
  p_id uuid, p_expected_updated_at timestamptz, p_name text, p_event_date date,
  p_location text, p_volunteer_count integer, p_status text, p_notes text, p_materials jsonb
) returns uuid security definer language plpgsql set search_path = '' as $$
declare v_current timestamptz;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória.' using errcode = '42501'; end if;
  if p_status not in ('planejada','concluida') then raise exception 'Status inválido.' using errcode = '22023'; end if;
  perform public.eco_drive_assert_input(p_name, p_event_date, p_volunteer_count, p_materials);
  select atualizado_em into v_current from public.eco_drive_campaigns where id = p_id for update;
  if not found then raise exception 'Campanha não encontrada.' using errcode = 'P0002'; end if;
  if v_current <> p_expected_updated_at then raise exception 'A campanha foi alterada por outra sessão.' using errcode = '40001'; end if;
  update public.eco_drive_campaigns set nome=btrim(p_name),data_evento=p_event_date,
    local=nullif(btrim(p_location),''),numero_voluntarios=p_volunteer_count,
    status=p_status,observacoes=nullif(btrim(p_notes),'') where id=p_id;
  insert into public.eco_drive_materials (campanha_id,tipo,quantidade,unidade)
  select p_id, item->>'type', (item->>'quantity')::numeric, item->>'unit'
  from jsonb_array_elements(p_materials) item
  on conflict (campanha_id,tipo) do update set quantidade=excluded.quantidade,unidade=excluded.unidade;
  return p_id;
end;
$$;

create or replace function public.set_eco_drive_campaign_archived(
  p_id uuid, p_expected_updated_at timestamptz, p_archived boolean
) returns uuid security definer language plpgsql set search_path = '' as $$
declare v_current timestamptz;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória.' using errcode = '42501'; end if;
  select atualizado_em into v_current from public.eco_drive_campaigns where id=p_id for update;
  if not found then raise exception 'Campanha não encontrada.' using errcode = 'P0002'; end if;
  if v_current <> p_expected_updated_at then raise exception 'A campanha foi alterada por outra sessão.' using errcode = '40001'; end if;
  update public.eco_drive_campaigns set
    arquivado_em=case when p_archived then now() else null end,
    arquivado_por=case when p_archived then auth.uid() else null end
  where id=p_id;
  return p_id;
end;
$$;

revoke all on function public.create_eco_drive_campaign(text,date,text,integer,text,text,jsonb) from public, anon;
revoke all on function public.update_eco_drive_campaign(uuid,timestamptz,text,date,text,integer,text,text,jsonb) from public, anon;
revoke all on function public.set_eco_drive_campaign_archived(uuid,timestamptz,boolean) from public, anon;
grant execute on function public.create_eco_drive_campaign(text,date,text,integer,text,text,jsonb) to authenticated;
grant execute on function public.update_eco_drive_campaign(uuid,timestamptz,text,date,text,integer,text,text,jsonb) to authenticated;
grant execute on function public.set_eco_drive_campaign_archived(uuid,timestamptz,boolean) to authenticated;

commit;

-- Verificação após executar:
-- select proname from pg_proc where proname like '%eco_drive_campaign%';
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'eco_drive%';
