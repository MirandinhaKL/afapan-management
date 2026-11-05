-- Sessões de upload e criação de solicitação. Executar somente com autorização.
begin;
set local lock_timeout = '5s';
alter table public.conecta_applications add column activity_reference text;
create table public.conecta_upload_sessions (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  origin_hash text not null check (origin_hash ~ '^[a-f0-9]{64}$'),
  manifest jsonb not null check (jsonb_typeof(manifest)='array'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '30 minutes',
  application_id uuid references public.conecta_applications,
  payload_hash text,
  verification_id uuid,
  verification_until timestamptz,
  check ((application_id is null) = (payload_hash is null))
);
create index conecta_upload_origin_time on public.conecta_upload_sessions(origin_hash,created_at);
alter table public.conecta_upload_sessions enable row level security;
revoke all on table public.conecta_upload_sessions from public, anon, authenticated, service_role;

create function public.conecta_reserve_upload(p_hash text,p_origin text,p_manifest jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
  if jsonb_typeof(p_manifest) is distinct from 'array' or jsonb_array_length(p_manifest) not between 1 and 5 then
    raise exception 'Comprovantes inválidos' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('conecta-upload:'||p_origin,0));
  if (select count(*) from public.conecta_upload_sessions where origin_hash=p_origin and created_at>=now()-interval '1 hour') >= 10 then
    raise exception 'Limite de tentativas' using errcode='P0001';
  end if;
  insert into public.conecta_upload_sessions(token_hash,origin_hash,manifest) values(p_hash,p_origin,p_manifest);
end $$;
revoke all on function public.conecta_reserve_upload(text,text,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.conecta_reserve_upload(text,text,jsonb) to service_role;

create function public.conecta_get_upload(p_hash text,p_verifier uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.conecta_upload_sessions%rowtype;
begin
  select * into s from public.conecta_upload_sessions where token_hash=p_hash and expires_at>now() for update;
  if not found then return null; end if;
  if s.application_id is null then
    if s.verification_until>now() then raise exception 'Comprovantes em conferência' using errcode='55P03'; end if;
    update public.conecta_upload_sessions set verification_id=p_verifier,verification_until=now()+interval '2 minutes' where token_hash=p_hash;
  end if;
  return jsonb_build_object('manifest',s.manifest,'applicationId',s.application_id,'payloadHash',s.payload_hash);
end;
$$;
revoke all on function public.conecta_get_upload(text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.conecta_get_upload(text,uuid) to service_role;

create function public.conecta_release_upload(p_hash text,p_verifier uuid)
returns void language sql security definer set search_path='' as $$
  update public.conecta_upload_sessions set verification_id=null,verification_until=null
  where token_hash=p_hash and verification_id=p_verifier;
$$;
revoke all on function public.conecta_release_upload(text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.conecta_release_upload(text,uuid) to service_role;

create function public.conecta_submit_application(p_hash text,p_verifier uuid,p_payload_hash text,p_input jsonb,p_verified jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  session_row public.conecta_upload_sessions%rowtype;
  modality uuid; version_id uuid; mode_name text; task_ids uuid[];
  file_row jsonb; reserved jsonb; application uuid; minutes integer;
begin
  select * into session_row from public.conecta_upload_sessions
    where token_hash=p_hash and expires_at>now() for update;
  if not found then raise exception 'Sessão expirada' using errcode='22023'; end if;
  if session_row.application_id is not null then
    if session_row.payload_hash is distinct from p_payload_hash then
      raise exception 'Sessão já utilizada' using errcode='22023';
    end if;
    return session_row.application_id;
  end if;
  if session_row.verification_id is distinct from p_verifier or coalesce(session_row.verification_until<=now(),true) then
    raise exception 'Conferência expirada' using errcode='22023';
  end if;
  if jsonb_typeof(p_verified) is distinct from 'array' or jsonb_array_length(p_verified)=0
      or jsonb_array_length(p_verified)<>jsonb_array_length(session_row.manifest) then
    raise exception 'Comprovantes não verificados' using errcode='22023';
  end if;
  version_id := (p_input->>'modalityVersion')::uuid;
  select m.id,v.mode into modality,mode_name from public.conecta_modality_versions v
    join public.conecta_modalities m on m.id=v.modality_id
    where v.id=version_id and m.active and v.version=(select max(x.version) from public.conecta_modality_versions x where x.modality_id=m.id)
    for share of m;
  if modality is null then raise exception 'Modalidade indisponível' using errcode='22023'; end if;
  select coalesce(array_agg(value::uuid),'{}') into task_ids from jsonb_array_elements_text(p_input->'tasks');
  minutes := (p_input->>'declaredMinutes')::integer;
  if mode_name='free' then
    if cardinality(task_ids)<>0 or coalesce(minutes,0)<=0 then raise exception 'Informe as horas realizadas' using errcode='22023'; end if;
  elsif minutes is not null or cardinality(task_ids)=0 or cardinality(task_ids) <>
      (select count(*) from public.conecta_tasks where modality_version_id=version_id and id=any(task_ids)) then
    raise exception 'Tarefas inválidas' using errcode='22023';
  end if;
  if (p_input->>'endDate')::date > (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'Período futuro' using errcode='22023';
  end if;
  insert into public.conecta_applications(cpf,birth_date,name,email,phone,institution,course,instagram,modality_id,modality_version_id,starts_on,ends_on,activity_reference)
    values(p_input->>'cpf',(p_input->>'birthDate')::date,p_input->>'name',p_input->>'email',p_input->>'phone',p_input->>'institution',p_input->>'course',
      nullif(p_input->>'instagram',''),modality,version_id,(p_input->>'startDate')::date,(p_input->>'endDate')::date,nullif(p_input->>'activityReference',''))
    returning id into application;
  insert into public.conecta_application_revisions(application_id,revision,report,declared_tasks,declared_minutes)
    values(application,1,p_input->>'report',task_ids,minutes);
  for file_row in select value from jsonb_array_elements(p_verified) loop
    select value into reserved from jsonb_array_elements(session_row.manifest) where value->>'id'=file_row->>'id';
    if reserved is null or (reserved->>'bytes')::bigint is distinct from (file_row->>'bytes')::bigint then
      raise exception 'Comprovante fora da sessão' using errcode='22023';
    end if;
    insert into public.conecta_attachments(id,application_id,revision,object_key,mime,bytes,sha256)
      values((reserved->>'id')::uuid,application,1,reserved->>'path',reserved->>'mime',(reserved->>'bytes')::bigint,file_row->>'sha256');
  end loop;
  update public.conecta_upload_sessions set application_id=application,payload_hash=p_payload_hash where token_hash=p_hash;
  return application;
end $$;
revoke all on function public.conecta_submit_application(text,uuid,text,jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.conecta_submit_application(text,uuid,text,jsonb,jsonb) to service_role;
commit;
