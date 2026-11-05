-- Catálogo versionado. Não aplicar remotamente sem autorização.
begin;
set local lock_timeout = '5s';

create table public.conecta_catalog_events (
  id uuid primary key default gen_random_uuid(),
  modality_id uuid not null references public.conecta_modalities,
  actor uuid not null references auth.users,
  action text not null check (action in ('create','version','publish','withdraw')),
  version_id uuid references public.conecta_modality_versions,
  created_at timestamptz not null default now()
);
alter table public.conecta_catalog_events enable row level security;
revoke all on table public.conecta_catalog_events from public, anon, authenticated, service_role;

create function public.conecta_is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and ativo is true);
$$;
revoke all on function public.conecta_is_active_user() from public, anon, authenticated, service_role;

create function public.conecta_read_catalog(p_internal boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if p_internal and not public.conecta_is_active_user() then
    raise exception 'Acesso interno necessário' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',m.id,'projectId',p.id,'project',p.name,'active',m.active,
      'versionId',v.id,'version',v.version,'name',v.name,'description',v.description,'mode',v.mode,
      'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'label',t.label,'minutes',t.minutes) order by t.position)
                        from public.conecta_tasks t where t.modality_version_id=v.id),'[]'::jsonb)
    ) order by p.name,v.name)
    from public.conecta_modalities m
    join public.conecta_projects p on p.id=m.project_id
    cross join lateral (
      select * from public.conecta_modality_versions where modality_id=m.id order by version desc limit 1
    ) v
    where m.active or p_internal
  ),'[]'::jsonb);
end $$;
revoke all on function public.conecta_read_catalog(boolean) from public, anon, authenticated, service_role;
grant execute on function public.conecta_read_catalog(boolean) to authenticated, service_role;

create function public.conecta_save_modality(
  p_id uuid, p_expected_version integer, p_project uuid, p_project_name text,
  p_name text, p_description text, p_mode text, p_tasks jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  m uuid; proj uuid; version_id uuid; version_number integer;
  task jsonb; idx integer := 0; label text; minutes integer;
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  if coalesce(length(btrim(p_name)),0) not between 1 and 160
      or length(coalesce(p_description,'')) > 3000
      or p_mode is null or p_mode not in ('checklist','free')
      or jsonb_typeof(p_tasks) is distinct from 'array' then
    raise exception 'Modalidade inválida' using errcode='22023';
  end if;
  if jsonb_array_length(p_tasks) > 100
      or (p_mode='checklist' and jsonb_array_length(p_tasks)=0)
      or (p_mode='free' and jsonb_array_length(p_tasks)<>0) then
    raise exception 'Tarefas incompatíveis com a modalidade' using errcode='22023';
  end if;
  if p_id is null then
    proj := p_project;
    if proj is null then
      if coalesce(length(btrim(p_project_name)),0) not between 1 and 160 then
        raise exception 'Informe o projeto' using errcode='22023';
      end if;
      insert into public.conecta_projects(slug,name) values(gen_random_uuid()::text,btrim(p_project_name)) returning id into proj;
    end if;
    insert into public.conecta_modalities(project_id,slug) values(proj,gen_random_uuid()::text) returning id into m;
    version_number := 1;
  else
    select id,project_id into m,proj from public.conecta_modalities where id=p_id for update;
    if m is null then raise exception 'Modalidade não encontrada' using errcode='P0002'; end if;
    if p_project is distinct from proj then raise exception 'O projeto de uma modalidade existente não pode ser trocado' using errcode='22023'; end if;
    select max(version) into version_number from public.conecta_modality_versions where modality_id=m;
    if version_number is distinct from p_expected_version then
      raise exception 'Modalidade alterada. Atualize a tela.' using errcode='40001';
    end if;
    version_number := version_number + 1;
  end if;
  insert into public.conecta_modality_versions(modality_id,version,name,description,mode)
    values(m,version_number,btrim(p_name),btrim(coalesce(p_description,'')),p_mode) returning id into version_id;
  for task in select value from jsonb_array_elements(p_tasks) loop
    label := btrim(task->>'label');
    if coalesce(length(label),0) not between 1 and 500 or jsonb_typeof(task->'minutes') is distinct from 'number'
        or coalesce(task->>'minutes','') !~ '^[1-9][0-9]{0,6}$' then
      raise exception 'Tarefa inválida' using errcode='22023';
    end if;
    minutes := (task->>'minutes')::integer;
    idx := idx + 1;
    insert into public.conecta_tasks(modality_version_id,position,label,minutes) values(version_id,idx,label,minutes);
  end loop;
  insert into public.conecta_catalog_events(modality_id,actor,action,version_id)
    values(m,auth.uid(),case when p_id is null then 'create' else 'version' end,version_id);
  return m;
end $$;
revoke all on function public.conecta_save_modality(uuid,integer,uuid,text,text,text,text,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.conecta_save_modality(uuid,integer,uuid,text,text,text,text,jsonb) to authenticated;

create function public.conecta_set_modality_active(p_id uuid,p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  update public.conecta_modalities set active=p_active where id=p_id;
  if not found then raise exception 'Modalidade não encontrada' using errcode='P0002'; end if;
  insert into public.conecta_catalog_events(modality_id,actor,action)
    values(p_id,auth.uid(),case when p_active then 'publish' else 'withdraw' end);
end $$;
revoke all on function public.conecta_set_modality_active(uuid,boolean) from public, anon, authenticated, service_role;
grant execute on function public.conecta_set_modality_active(uuid,boolean) to authenticated;
commit;
