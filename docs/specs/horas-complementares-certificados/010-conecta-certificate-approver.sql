-- Alinha signatário ao autor da aprovação. Preserva emissões existentes e permissões.
begin;
create or replace function public.conecta_reserve_certificate(p_id uuid,p_actor uuid,p_code text,p_config jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  a public.conecta_applications%rowtype; d public.conecta_decisions%rowtype;
  c public.conecta_certificates%rowtype; previous_id uuid; modality text; signer_name text;
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
      exists(select 1 from unnest(array['city']) k where coalesce(length(btrim(p_config->>k)),0) not between 1 and 160) then
      raise exception 'Configuração de emissão incompleta' using errcode='22023';
    end if;
    select btrim(nome) into signer_name from public.profiles where id=d.actor;
    if coalesce(length(signer_name),0) not between 1 and 160 then
      raise exception 'Nome do aprovador indisponível' using errcode='22023';
    end if;
    select id into previous_id from public.conecta_certificates where decision_id=d.id order by invalidated_at desc limit 1;
    select name into strict modality from public.conecta_modality_versions where id=a.modality_version_id;
    insert into public.conecta_certificates(decision_id,replaces,code,snapshot)
    values(d.id,previous_id,p_code,jsonb_build_object(
      'version',1,'code',p_code,'name',a.name,'cpf',a.cpf,'course',a.course,'institution',a.institution,
      'modality',modality,'startDate',a.starts_on,'endDate',a.ends_on,'minutes',d.minutes,
      'issuedAt',date_trunc('second',now()),'signer',signer_name,'title','AFAPAN',
      'city',p_config->>'city','issuedBy',p_actor))
    returning * into c;
  end if;
  return jsonb_build_object('id',c.id,'snapshot',c.snapshot,'path',c.generated_key,'sha256',c.generated_sha256);
end $$;
commit;
