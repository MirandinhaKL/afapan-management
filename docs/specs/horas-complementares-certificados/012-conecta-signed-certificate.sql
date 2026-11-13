-- Recebimento e conferência do PDF assinado. Aplicação remota separada.
begin;

alter table public.conecta_certificates add column confirmed_by uuid references auth.users;

create function public.conecta_signed_certificate_context(p_application uuid,p_certificate uuid,p_actor uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id=p_actor and ativo) then
    raise exception 'Acesso interno necessário' using errcode='42501';
  end if;
  return (
    select jsonb_build_object('originalHash',c.generated_sha256,'signedKey',c.signed_key,'name',c.snapshot->>'name')
    from public.conecta_certificates c
    join public.conecta_decisions d on d.id=c.decision_id and d.decision='approved'
    join public.conecta_applications a on a.id=d.application_id and a.revision=d.revision
    where a.id=p_application and a.status='approved' and c.id=p_certificate
      and c.invalidated_at is null and c.generated_key is not null and c.generated_sha256 is not null
  );
end $$;

create function public.conecta_confirm_signed_certificate(p_application uuid,p_certificate uuid,p_actor uuid,p_upload uuid,p_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare
  emission public.conecta_certificates%rowtype;
  signed_path text := 'certificates/'||p_certificate||'/signed/'||p_upload||'.pdf';
  recipient_email text;
begin
  if not exists(select 1 from public.profiles where id=p_actor and ativo) then
    raise exception 'Acesso interno necessário' using errcode='42501';
  end if;
  select c.* into emission
    from public.conecta_certificates c
    join public.conecta_decisions d on d.id=c.decision_id and d.decision='approved'
    join public.conecta_applications a on a.id=d.application_id and a.revision=d.revision
    where a.id=p_application and a.status='approved' and c.id=p_certificate
    for update of c;
  if not found or emission.invalidated_at is not null or emission.generated_key is null or emission.generated_sha256 is null then
    raise exception 'Emissão indisponível' using errcode='40001';
  end if;
  if p_upload is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_hash=emission.generated_sha256 then
    raise exception 'PDF assinado inválido' using errcode='22023';
  end if;
  if emission.signed_key is not null then
    if emission.signed_key=signed_path and emission.signed_sha256=p_hash then return; end if;
    raise exception 'Emissão já conferida' using errcode='40001';
  end if;
  select email into strict recipient_email from public.conecta_applications where id=p_application;
  update public.conecta_certificates
    set signed_key=signed_path,signed_sha256=p_hash,published_at=now(),confirmed_by=p_actor
    where id=p_certificate;
  insert into public.conecta_email_outbox(application_id,certificate_id,event_key,purpose,recipient)
    values(p_application,p_certificate,'certificate:'||p_certificate,'certificate',recipient_email);
end $$;

revoke all on function public.conecta_signed_certificate_context(uuid,uuid,uuid),
  public.conecta_confirm_signed_certificate(uuid,uuid,uuid,uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.conecta_signed_certificate_context(uuid,uuid,uuid),
  public.conecta_confirm_signed_certificate(uuid,uuid,uuid,uuid,text) to service_role;

commit;
