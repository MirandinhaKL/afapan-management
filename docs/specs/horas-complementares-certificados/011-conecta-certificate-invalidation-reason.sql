-- Exibe o motivo registrado na consulta administrativa da emissão.
begin;

create or replace function public.conecta_certificate_status(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.conecta_is_active_user() then
    raise exception 'Acesso interno necessário' using errcode='42501';
  end if;
  return (
    select jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'generated', c.generated_key is not null,
      'published', c.published_at is not null,
      'invalidated', c.invalidated_at is not null,
      'invalidationReason', case when c.invalidated_at is not null then c.invalidation_reason end
    )
    from public.conecta_certificates c
    join public.conecta_decisions d on d.id=c.decision_id
    join public.conecta_applications a on a.id=d.application_id and a.revision=d.revision
    where a.id=p_id
    order by (c.invalidated_at is null) desc, c.invalidated_at desc
    limit 1
  );
end $$;

commit;
