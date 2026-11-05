-- Emissão local aditiva. Não aplicar remotamente sem autorização.
begin;
alter table public.conecta_certificates
  add column generated_sha256 text check (generated_sha256 ~ '^[a-f0-9]{64}$'),
  add column invalidated_by uuid references auth.users;

create function public.conecta_certificate_status(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  return (select jsonb_build_object('id',c.id,'code',c.code,'generated',c.generated_key is not null,
    'published',c.published_at is not null,'invalidated',c.invalidated_at is not null)
    from public.conecta_certificates c join public.conecta_decisions d on d.id=c.decision_id
    join public.conecta_applications a on a.id=d.application_id and a.revision=d.revision
    where a.id=p_id order by (c.invalidated_at is null) desc,c.invalidated_at desc limit 1);
end $$;

create function public.conecta_reserve_certificate(p_id uuid,p_actor uuid,p_code text,p_config jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  a public.conecta_applications%rowtype; d public.conecta_decisions%rowtype;
  c public.conecta_certificates%rowtype; previous_id uuid; modality text;
begin
  if not exists(select 1 from public.profiles where id=p_actor and ativo) then
    raise exception 'Acesso interno necessário' using errcode='42501';
  end if;
  select * into a from public.conecta_applications where id=p_id for update;
  if not found or a.status<>'approved' then raise exception 'Solicitação não aprovada' using errcode='40001'; end if;
  select * into strict d from public.conecta_decisions where application_id=a.id and revision=a.revision and decision='approved';
  select * into c from public.conecta_certificates where decision_id=d.id and invalidated_at is null for update;
  if not found then
    if p_code is null or p_code !~ '^[A-F0-9]{32}$' or
      exists(select 1 from unnest(array['signer','city']) k where coalesce(length(btrim(p_config->>k)),0) not between 1 and 160) then
      raise exception 'Configuração de emissão incompleta' using errcode='22023';
    end if;
    select id into previous_id from public.conecta_certificates where decision_id=d.id order by invalidated_at desc limit 1;
    select name into strict modality from public.conecta_modality_versions where id=a.modality_version_id;
    insert into public.conecta_certificates(decision_id,replaces,code,snapshot)
    values(d.id,previous_id,p_code,jsonb_build_object(
      'version',1,'code',p_code,'name',a.name,'cpf',a.cpf,'course',a.course,'institution',a.institution,
      'modality',modality,'startDate',a.starts_on,'endDate',a.ends_on,'minutes',d.minutes,
      'issuedAt',date_trunc('second',now()),'signer',(select nome from public.profiles where id=d.actor),'title','AFAPAN',
      'city',p_config->>'city','issuedBy',p_actor))
    returning * into c;
  end if;
  return jsonb_build_object('id',c.id,'snapshot',c.snapshot,'path',c.generated_key,'sha256',c.generated_sha256);
end $$;

create function public.conecta_finish_certificate(p_id uuid,p_hash text)
returns text language plpgsql security definer set search_path='' as $$
declare object_path text := 'certificates/'||p_id||'/original.pdf';
begin
  if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'Hash inválido' using errcode='22023'; end if;
  update public.conecta_certificates set generated_key=object_path,generated_sha256=p_hash
    where id=p_id and invalidated_at is null and (generated_sha256 is null or generated_sha256=p_hash);
  if not found then raise exception 'Emissão alterada' using errcode='40001'; end if;
  return object_path;
end $$;

create function public.conecta_invalidate_certificate(p_id uuid,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.conecta_is_active_user() then raise exception 'Acesso interno necessário' using errcode='42501'; end if;
  if coalesce(length(btrim(p_reason)),0) not between 1 and 3000 then raise exception 'Informe o motivo' using errcode='22023'; end if;
  update public.conecta_certificates set invalidated_at=now(),invalidation_reason=btrim(p_reason),invalidated_by=auth.uid()
    where id=p_id and invalidated_at is null;
  if not found then raise exception 'Emissão alterada' using errcode='40001'; end if;
  update public.conecta_email_outbox set status='cancelled' where certificate_id=p_id and status='queued';
end $$;

revoke all on function public.conecta_certificate_status(uuid), public.conecta_reserve_certificate(uuid,uuid,text,jsonb),
  public.conecta_finish_certificate(uuid,text), public.conecta_invalidate_certificate(uuid,text)
  from public, anon, authenticated, service_role;
grant execute on function public.conecta_certificate_status(uuid), public.conecta_invalidate_certificate(uuid,text) to authenticated;
grant execute on function public.conecta_reserve_certificate(uuid,uuid,text,jsonb), public.conecta_finish_certificate(uuid,text) to service_role;
commit;
