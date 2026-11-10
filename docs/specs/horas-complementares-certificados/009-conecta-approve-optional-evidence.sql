-- Aprovação compatível com comprovantes opcionais. Preserva decisões, RLS e grants.
begin;
create or replace function public.conecta_review_application(p_id uuid,p_revision integer,p_decision text,p_tasks uuid[],p_minutes integer,p_reason text)
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
commit;
