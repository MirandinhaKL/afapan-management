-- Fila e revisão. Não aplicar remotamente sem autorização.
begin;
set local lock_timeout = '5s';
alter table public.conecta_email_outbox add column payload jsonb not null default '{}'::jsonb;
create index conecta_queue_status_time on public.conecta_applications(status,created_at desc,id);

create function public.conecta_list_applications(p_query text,p_status text,p_offset integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare q text := btrim(coalesce(p_query,'')); digits text;
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  if length(q)>160 or coalesce(p_offset,-1)<0 or p_status is null or p_status not in ('all','pending','approved','sent','rejected','returned') then
    raise exception 'Filtro inválido' using errcode='22023';
  end if;
  digits := regexp_replace(q,'[.[:space:]-]','','g');
  return (
    with items as (
      select a.id,a.name,a.status,a.starts_on,a.ends_on,a.created_at,v.name as modality,
        exists(select 1 from public.conecta_certificates c
          join public.conecta_decisions d on d.id=c.decision_id
          join public.conecta_email_outbox e on e.certificate_id=c.id
          where d.application_id=a.id and c.invalidated_at is null and e.status='accepted') as sent
      from public.conecta_applications a join public.conecta_modality_versions v on v.id=a.modality_version_id
      where q='' or strpos(lower(a.name),lower(q))>0 or (digits ~ '^[0-9]+$' and strpos(a.cpf,digits)>0)
    ), filtered as (
      select * from items where p_status='all' or (p_status='sent' and sent)
        or (p_status=status and (status<>'approved' or not sent))
    ), page as (
      select * from filtered order by created_at desc,id desc limit 20 offset p_offset
    )
    select jsonb_build_object(
      'total',(select count(*) from filtered),
      'pending',(select count(*) from public.conecta_applications where status='pending'),
      'items',coalesce((select jsonb_agg(to_jsonb(page) order by created_at desc,id desc) from page),'[]'::jsonb)
    )
  );
end $$;
revoke all on function public.conecta_list_applications(text,text,integer) from public, anon, authenticated, service_role;
grant execute on function public.conecta_list_applications(text,text,integer) to authenticated;

create function public.conecta_get_application(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  return (select jsonb_build_object(
    'id',a.id,'name',a.name,'cpf',a.cpf,'email',a.email,'phone',a.phone,'institution',a.institution,'course',a.course,
    'instagram',a.instagram,'activity_reference',a.activity_reference,'status',a.status,'starts_on',a.starts_on,'ends_on',a.ends_on,
    'modality',v.name,'mode',v.mode,'revision',a.revision,'approved_minutes',a.approved_minutes,
    'report',r.report,'declared_tasks',r.declared_tasks,'declared_minutes',r.declared_minutes,
    'tasks',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'label',t.label,'minutes',t.minutes) order by t.position)
      from public.conecta_tasks t where t.modality_version_id=a.modality_version_id),'[]'::jsonb),
    'attachments',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'mime',f.mime,'bytes',f.bytes))
      from public.conecta_attachments f where f.application_id=a.id and f.revision=a.revision),'[]'::jsonb),
    'decisions',coalesce((select jsonb_agg(jsonb_build_object('revision',d.revision,'decision',d.decision,'reason',d.reason,
      'minutes',d.minutes,'created_at',d.created_at,'recognized_tasks',d.recognized_tasks) order by d.revision desc)
      from public.conecta_decisions d where d.application_id=a.id),'[]'::jsonb),
    'history',coalesce((select jsonb_agg(jsonb_build_object('id',h.id,'status',h.status,'starts_on',h.starts_on,'ends_on',h.ends_on,
      'minutes',h.approved_minutes,'modality',hv.name) order by h.starts_on desc,h.id)
      from public.conecta_applications h join public.conecta_modality_versions hv on hv.id=h.modality_version_id
      where h.cpf=a.cpf and h.birth_date=a.birth_date and h.id<>a.id),'[]'::jsonb),
    'modality_minutes',(select coalesce(sum(h.approved_minutes),0) from public.conecta_applications h
      where h.cpf=a.cpf and h.birth_date=a.birth_date and h.modality_id=a.modality_id)
  ) from public.conecta_applications a
    join public.conecta_modality_versions v on v.id=a.modality_version_id
    join public.conecta_application_revisions r on r.application_id=a.id and r.revision=a.revision
    where a.id=p_id);
end $$;
revoke all on function public.conecta_get_application(uuid) from public, anon, authenticated, service_role;
grant execute on function public.conecta_get_application(uuid) to authenticated;

create function public.conecta_evidence_path(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  return (select jsonb_build_object('path',object_key,'mime',mime) from public.conecta_attachments where id=p_id);
end $$;
revoke all on function public.conecta_evidence_path(uuid) from public, anon, authenticated, service_role;
grant execute on function public.conecta_evidence_path(uuid) to authenticated;

create function public.conecta_review_application(p_id uuid,p_revision integer,p_decision text,p_tasks uuid[],p_minutes integer,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  a public.conecta_applications%rowtype; r public.conecta_application_revisions%rowtype;
  mode_name text; task_total bigint; task_count integer; approved integer; decision_id uuid;
  chosen uuid[] := coalesce(p_tasks,'{}'); reason_text text := nullif(btrim(p_reason),'');
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  if p_decision is null or p_decision not in ('approved','rejected') or length(coalesce(reason_text,''))>3000 then
    raise exception 'Decisão inválida' using errcode='22023';
  end if;
  select * into a from public.conecta_applications where id=p_id for update;
  if not found then raise exception 'Solicitação não encontrada' using errcode='P0002'; end if;
  if a.status<>'pending' or a.revision is distinct from p_revision then raise exception 'Revisão desatualizada' using errcode='40001'; end if;
  select * into r from public.conecta_application_revisions where application_id=a.id and revision=a.revision;
  if p_decision='approved' then
    if not exists(select 1 from public.conecta_attachments where application_id=a.id and revision=a.revision) then
      raise exception 'Comprovante ausente' using errcode='22023';
    end if;
    select mode into mode_name from public.conecta_modality_versions where id=a.modality_version_id;
    if mode_name='free' then
      if cardinality(chosen)<>0 or coalesce(p_minutes,0)<=0 or (p_minutes is distinct from r.declared_minutes and reason_text is null) then
        raise exception 'Confira as horas e justifique ajustes' using errcode='22023';
      end if;
      approved := p_minutes;
    else
      select count(*),coalesce(sum(minutes),0) into task_count,task_total from public.conecta_tasks
        where modality_version_id=a.modality_version_id and id=any(chosen);
      if p_minutes is not null or task_count=0 or task_count<>cardinality(chosen) or task_total>2147483647
          or (not (chosen <@ r.declared_tasks and chosen @> r.declared_tasks) and reason_text is null) then
        raise exception 'Confira as tarefas e justifique ajustes' using errcode='22023';
      end if;
      approved := task_total::integer;
    end if;
  else
    if reason_text is null then raise exception 'Informe o motivo da recusa' using errcode='22023'; end if;
    chosen := '{}';
  end if;
  insert into public.conecta_decisions(application_id,revision,actor,decision,recognized_tasks,minutes,reason)
    values(a.id,a.revision,auth.uid(),p_decision,chosen,approved,reason_text) returning id into decision_id;
  update public.conecta_applications set status=p_decision,approved_minutes=approved,updated_at=now() where id=a.id;
  if p_decision='rejected' then
    insert into public.conecta_email_outbox(application_id,event_key,purpose,recipient,payload)
      values(a.id,'rejection:'||decision_id,'rejection',a.email,jsonb_build_object('reason',reason_text,'decisionId',decision_id));
  end if;
  return decision_id;
end $$;
revoke all on function public.conecta_review_application(uuid,integer,text,uuid[],integer,text) from public, anon, authenticated, service_role;
grant execute on function public.conecta_review_application(uuid,integer,text,uuid[],integer,text) to authenticated;
commit;
