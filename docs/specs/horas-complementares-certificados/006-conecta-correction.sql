-- Correção preserva revisões e arquivos. Não executar remotamente sem autorização.
begin;
create table public.conecta_correction_tokens (
  id uuid primary key,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  application_id uuid not null references public.conecta_applications,
  revision integer not null,
  expires_at timestamptz not null default now()+interval '48 hours',
  consumed_at timestamptz,
  foreign key (application_id,revision) references public.conecta_application_revisions
);
alter table public.conecta_correction_tokens enable row level security;
revoke all on table public.conecta_correction_tokens from public, anon, authenticated, service_role;

create function public.conecta_request_correction(p_id uuid,p_revision integer,p_reason text,p_token_id uuid,p_token_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare a public.conecta_applications%rowtype;
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  if coalesce(length(btrim(p_reason)),0) not between 1 and 3000 then raise exception 'Informe a orientação' using errcode='22023'; end if;
  select * into a from public.conecta_applications where id=p_id for update;
  if not found or a.revision is distinct from p_revision or a.status not in ('pending','rejected','returned') then
    raise exception 'Revisão desatualizada' using errcode='40001';
  end if;
  update public.conecta_email_outbox e set status='cancelled'
    from public.conecta_correction_tokens c
    where c.application_id=a.id and c.revision=a.revision and e.event_key='correction:'||c.id and e.status='queued';
  update public.conecta_correction_tokens set expires_at=now()
    where application_id=a.id and revision=a.revision and consumed_at is null and expires_at>now();
  if a.status='pending' then
    insert into public.conecta_decisions(application_id,revision,actor,decision,reason)
      values(a.id,a.revision,auth.uid(),'returned',btrim(p_reason));
  end if;
  update public.conecta_applications set status='returned',updated_at=now() where id=a.id;
  insert into public.conecta_correction_tokens(id,token_hash,application_id,revision)
    values(p_token_id,p_token_hash,a.id,a.revision);
  insert into public.conecta_email_outbox(application_id,event_key,purpose,recipient,payload)
    values(a.id,'correction:'||p_token_id,'correction',a.email,
      jsonb_build_object('reason',btrim(p_reason),'correctionId',p_token_id,'actor',auth.uid()));
end $$;
revoke all on function public.conecta_request_correction(uuid,integer,text,uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.conecta_request_correction(uuid,integer,text,uuid,text) to authenticated;

create function public.conecta_get_correction(p_hash text)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('name',v.name,'mode',v.mode,'report',r.report,
    'selected',r.declared_tasks,'minutes',r.declared_minutes,'reason',e.payload->>'reason',
    'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'label',t.label,'minutes',t.minutes) order by t.position)
      from public.conecta_tasks t where t.modality_version_id=v.id),'[]'::jsonb))
  from public.conecta_correction_tokens c
  join public.conecta_applications a on a.id=c.application_id and a.revision=c.revision
  join public.conecta_application_revisions r on r.application_id=a.id and r.revision=a.revision
  join public.conecta_modality_versions v on v.id=a.modality_version_id
  left join public.conecta_email_outbox e on e.event_key='correction:'||c.id
  where c.token_hash=p_hash and c.expires_at>now() and c.consumed_at is null and a.status='returned';
$$;
revoke all on function public.conecta_get_correction(text) from public, anon, authenticated, service_role;
grant execute on function public.conecta_get_correction(text) to service_role;

create function public.conecta_submit_correction(p_hash text,p_upload text,p_verifier uuid,p_payload_hash text,p_input jsonb,p_verified jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  t public.conecta_correction_tokens%rowtype; a public.conecta_applications%rowtype;
  u public.conecta_upload_sessions%rowtype; mode_name text; chosen uuid[]; mins integer;
  file_row jsonb; reserved jsonb; next_revision integer;
begin
  select * into t from public.conecta_correction_tokens where token_hash=p_hash;
  if not found then raise exception 'Correção indisponível' using errcode='22023'; end if;
  select * into a from public.conecta_applications where id=t.application_id for update;
  select * into t from public.conecta_correction_tokens where token_hash=p_hash and expires_at>now() for update;
  if not found then raise exception 'Correção indisponível' using errcode='22023'; end if;
  select * into u from public.conecta_upload_sessions where token_hash=p_upload and expires_at>now() for update;
  if not found then raise exception 'Comprovantes indisponíveis' using errcode='22023'; end if;
  if u.application_id is not null then
    if t.consumed_at is not null and u.application_id=t.application_id and u.payload_hash=p_payload_hash then return u.application_id; end if;
    raise exception 'Sessão já utilizada' using errcode='22023';
  end if;
  if t.consumed_at is not null or u.verification_id is distinct from p_verifier or coalesce(u.verification_until<=now(),true) then
    raise exception 'Correção indisponível' using errcode='22023';
  end if;
  if a.revision<>t.revision or a.status<>'returned' then raise exception 'Revisão desatualizada' using errcode='40001'; end if;
  if jsonb_typeof(p_verified) is distinct from 'array' or jsonb_array_length(p_verified)=0
    or jsonb_array_length(p_verified)<>jsonb_array_length(u.manifest) then
    raise exception 'Comprovantes inválidos' using errcode='22023';
  end if;
  select mode into mode_name from public.conecta_modality_versions where id=a.modality_version_id;
  select coalesce(array_agg(value::uuid),'{}') into chosen from jsonb_array_elements_text(p_input->'tasks');
  mins := (p_input->>'declaredMinutes')::integer;
  if (mode_name='free' and (cardinality(chosen)<>0 or coalesce(mins,0)<=0))
    or (mode_name='checklist' and (mins is not null or cardinality(chosen)=0 or cardinality(chosen)<>(select count(*) from public.conecta_tasks where modality_version_id=a.modality_version_id and id=any(chosen)))) then
    raise exception 'Confira tarefas ou horas' using errcode='22023';
  end if;
  next_revision := a.revision+1;
  insert into public.conecta_application_revisions(application_id,revision,report,declared_tasks,declared_minutes)
    values(a.id,next_revision,p_input->>'report',chosen,mins);
  for file_row in select value from jsonb_array_elements(p_verified) loop
    select value into reserved from jsonb_array_elements(u.manifest) where value->>'id'=file_row->>'id';
    if reserved is null or (reserved->>'bytes')::bigint is distinct from (file_row->>'bytes')::bigint then
      raise exception 'Comprovante fora da sessão' using errcode='22023';
    end if;
    insert into public.conecta_attachments(id,application_id,revision,object_key,mime,bytes,sha256)
      values((reserved->>'id')::uuid,a.id,next_revision,reserved->>'path',reserved->>'mime',(reserved->>'bytes')::bigint,file_row->>'sha256');
  end loop;
  update public.conecta_applications set revision=next_revision,status='pending',updated_at=now() where id=a.id;
  update public.conecta_correction_tokens set consumed_at=now() where id=t.id;
  update public.conecta_upload_sessions set application_id=a.id,payload_hash=p_payload_hash where token_hash=p_upload;
  return a.id;
end $$;
revoke all on function public.conecta_submit_correction(text,text,uuid,text,jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.conecta_submit_correction(text,text,uuid,text,jsonb,jsonb) to service_role;
commit;
