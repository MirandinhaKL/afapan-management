-- 006: cadastro permanente de voluntários AFAPAN.
-- Preparação local. EXECUTAR REMOTAMENTE SOMENTE APÓS AUTORIZAÇÃO EXPLÍCITA.
-- Pré-requisitos: 001 + revisão 003/004 ou definição-base atual equivalente.
-- Não depende de 005 e NÃO altera catálogo nem exclui interesses.
-- Preserva dados históricos e vínculos de campanhas.
-- Não reaplicar 002 ou 005 depois deste arquivo sem reconciliar/reaplicar 006.
-- Aplicar em janela coordenada com a aplicação, após conferir jobs em execução.

begin;
set local lock_timeout = '5s';

create table if not exists public.volunteer_registration_settings (
  id smallint primary key check (id = 1),
  privacy_text text not null check (btrim(privacy_text) <> ''),
  privacy_version text not null check (btrim(privacy_version) <> ''),
  participation_text text not null check (btrim(participation_text) <> ''),
  participation_version text not null check (btrim(participation_version) <> '')
);

insert into public.volunteer_registration_settings(id,privacy_text,privacy_version,participation_text,participation_version)
values (
  1,
  'Declaro que li e estou ciente de que a AFAPAN utilizará os dados informados neste formulário para organizar ações de voluntariado, manter contato comigo e administrar o cadastro de voluntários, conforme o aviso de privacidade apresentado.',
  'permanente-1',
  'Confirmo que desejo participar como voluntário(a) da AFAPAN e autorizo o contato pelos canais informados, inclusive pelo WhatsApp, bem como minha inclusão no grupo de voluntários ativos.',
  'permanente-1'
) on conflict (id) do nothing;

alter table public.volunteer_registration_settings enable row level security;
revoke all on table public.volunteer_registration_settings from public,anon,authenticated;
grant select on table public.volunteer_registration_settings to service_role;

create or replace function public.submit_permanent_volunteer_registration(
  p_payload jsonb, p_source_hash text, p_phone_hash text
) returns uuid security definer language plpgsql set search_path = '' as $$
declare
  v_settings public.volunteer_registration_settings%rowtype;
  v_guardian_phone text;
  v_id uuid;
  v_birth date;
  v_phone text;
  v_origin text := 'publico';
begin
  select * into v_settings from public.volunteer_registration_settings where id=1 for share;
  if not found then raise exception 'FORM_CONFIGURATION_MISSING' using errcode='P0002'; end if;
  if coalesce((p_payload->>'privacyAccepted')::boolean,false) is not true
    or coalesce((p_payload->>'participationAccepted')::boolean,false) is not true then
    raise exception 'CONSENT_REQUIRED' using errcode='22023';
  end if;
  if (p_payload->>'privacyVersion') is distinct from v_settings.privacy_version
    or (p_payload->>'participationVersion') is distinct from v_settings.participation_version then
    raise exception 'FORM_VERSION_OUTDATED' using errcode='22023';
  end if;

  v_birth := (p_payload->>'birthDate')::date;
  v_phone := regexp_replace(coalesce(p_payload->>'phone',''),'[^0-9]','','g');
  if length(v_phone) in (10,11) then v_phone := '55' || v_phone; end if;
  if v_phone !~ '^55[0-9]{10,11}$' then raise exception 'INVALID_PHONE' using errcode='22023'; end if;
  v_guardian_phone := regexp_replace(coalesce(p_payload->>'guardianPhone',''),'[^0-9]','','g');
  if length(v_guardian_phone) in (10,11) then v_guardian_phone := '55' || v_guardian_phone; end if;
  if v_birth > current_date - interval '18 years' then
    if v_guardian_phone !~ '^55[0-9]{10,11}$' then raise exception 'INVALID_GUARDIAN_PHONE' using errcode='22023'; end if;
    if nullif(btrim(p_payload->>'guardianName'),'') is null
      or coalesce((p_payload->>'guardianAuthorized')::boolean,false) is not true then
      raise exception 'GUARDIAN_AUTHORIZATION_REQUIRED' using errcode='22023';
    end if;
  end if;
  if v_phone is null or exists (
    select 1 from public.volunteers
    where telefone_normalizado = v_phone and arquivado_em is null
  ) then
    raise exception 'PHONE_ALREADY_REGISTERED' using errcode='23505';
  end if;

  insert into public.volunteers(
    campaign_id,nome,sobrenome,data_nascimento,telefone,telefone_normalizado,email,rua,numero,complemento,bairro,cidade,estado,
    profissao,habilidades,expectativas,como_conheceu,experiencia_voluntariado,canais_comunicacao,ideia_projeto,
    uso_imagem_autorizado,historia_afapan,inicio_atividades_mes,inicio_atividades_ano,responsavel_nome,responsavel_telefone,
    responsavel_telefone_normalizado,responsavel_autorizou,status,origem
  ) values (
    null,btrim(p_payload->>'firstName'),btrim(p_payload->>'lastName'),v_birth,p_payload->>'phone',v_phone,
    nullif(btrim(p_payload->>'email'),''),nullif(btrim(p_payload->>'street'),''),nullif(btrim(p_payload->>'number'),''),
    nullif(btrim(p_payload->>'complement'),''),btrim(p_payload->>'neighborhood'),btrim(p_payload->>'city'),nullif(btrim(p_payload->>'state'),''),
    nullif(btrim(p_payload->>'profession'),''),nullif(btrim(p_payload->>'skills'),''),nullif(btrim(p_payload->>'expectations'),''),
    nullif(btrim(p_payload->>'discoverySource'),''),nullif(p_payload->>'previousVolunteering',''),
    array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),nullif(btrim(p_payload->>'projectIdea'),''),
    case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized' = 'null'::jsonb
      then null else (p_payload->>'imageUseAuthorized')::boolean end,
    nullif(btrim(p_payload->>'afapanStory'),''),(p_payload->>'activityStartMonth')::smallint,
    (p_payload->>'activityStartYear')::smallint,nullif(btrim(p_payload->>'guardianName'),''),nullif(btrim(p_payload->>'guardianPhone'),''),
    nullif(v_guardian_phone,''),coalesce((p_payload->>'guardianAuthorized')::boolean,false),'aguardando_validacao',v_origin
  ) returning id into v_id;

  insert into public.volunteer_availability(volunteer_id,frequencia)
  values(v_id,p_payload->>'frequency');
  insert into public.volunteer_interests(volunteer_id,atividade)
  select v_id,value
  from jsonb_array_elements_text(p_payload->'activities');
  insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem) values
    (v_id,'privacidade',v_settings.privacy_version,v_settings.privacy_text,v_origin),
    (v_id,'participacao',v_settings.participation_version,v_settings.participation_text,v_origin);
  if v_birth > current_date - interval '18 years' then
    insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem)
    values(v_id,'responsavel','1','Autorização do responsável',v_origin);
  end if;
  return v_id;
end;
$$;

create or replace function public.save_assisted_volunteer(
  p_id uuid,p_expected_updated_at timestamptz,p_payload jsonb
) returns uuid security definer language plpgsql set search_path = '' as $$
declare
  v_settings public.volunteer_registration_settings%rowtype;
  v_id uuid;
  v_current timestamptz;
  v_is_new boolean := p_id is null;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_is_new then
    select * into v_settings from public.volunteer_registration_settings where id=1 for share;
    if not found then raise exception 'FORM_CONFIGURATION_MISSING' using errcode='P0002'; end if;
    if coalesce((p_payload->>'privacyAccepted')::boolean,false) is not true
      or coalesce((p_payload->>'participationAccepted')::boolean,false) is not true then
      raise exception 'CONSENT_REQUIRED' using errcode='22023';
    end if;
    insert into public.volunteers(
      nome,sobrenome,data_nascimento,telefone,telefone_normalizado,email,rua,numero,complemento,bairro,cidade,estado,
      profissao,habilidades,expectativas,como_conheceu,experiencia_voluntariado,canais_comunicacao,ideia_projeto,uso_imagem_autorizado,
      historia_afapan,inicio_atividades_mes,inicio_atividades_ano,responsavel_nome,responsavel_telefone,responsavel_telefone_normalizado,
      responsavel_autorizou,status,origem,criado_por,validado_por,validado_em
    ) values (
      btrim(p_payload->>'firstName'),btrim(p_payload->>'lastName'),(p_payload->>'birthDate')::date,p_payload->>'phone',p_payload->>'normalizedPhone',
      nullif(btrim(p_payload->>'email'),''),nullif(btrim(p_payload->>'street'),''),nullif(btrim(p_payload->>'number'),''),nullif(btrim(p_payload->>'complement'),''),
      btrim(p_payload->>'neighborhood'),btrim(p_payload->>'city'),nullif(btrim(p_payload->>'state'),''),nullif(btrim(p_payload->>'profession'),''),
      nullif(btrim(p_payload->>'skills'),''),nullif(btrim(p_payload->>'expectations'),''),nullif(btrim(p_payload->>'discoverySource'),''),
      nullif(p_payload->>'previousVolunteering',''),array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),
      nullif(btrim(p_payload->>'projectIdea'),''),case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized' = 'null'::jsonb
        then null else (p_payload->>'imageUseAuthorized')::boolean end,
      nullif(btrim(p_payload->>'afapanStory'),''),(p_payload->>'activityStartMonth')::smallint,(p_payload->>'activityStartYear')::smallint,
      nullif(btrim(p_payload->>'guardianName'),''),nullif(btrim(p_payload->>'guardianPhone'),''),nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),
      coalesce((p_payload->>'guardianAuthorized')::boolean,false),coalesce(p_payload->>'status','ativo'),'assistido',auth.uid(),auth.uid(),now()
    ) returning id into v_id;
  else
    select atualizado_em into v_current from public.volunteers where id=p_id for update;
    if not found then raise exception 'VOLUNTEER_NOT_FOUND' using errcode='P0002'; end if;
    if v_current is distinct from p_expected_updated_at then raise exception 'VOLUNTEER_CONFLICT' using errcode='40001'; end if;
    update public.volunteers set
      nome=btrim(p_payload->>'firstName'),sobrenome=btrim(p_payload->>'lastName'),data_nascimento=(p_payload->>'birthDate')::date,
      telefone=p_payload->>'phone',telefone_normalizado=p_payload->>'normalizedPhone',email=nullif(btrim(p_payload->>'email'),''),
      rua=nullif(btrim(p_payload->>'street'),''),numero=nullif(btrim(p_payload->>'number'),''),complemento=nullif(btrim(p_payload->>'complement'),''),
      bairro=btrim(p_payload->>'neighborhood'),cidade=btrim(p_payload->>'city'),estado=nullif(btrim(p_payload->>'state'),''),
      profissao=nullif(btrim(p_payload->>'profession'),''),habilidades=nullif(btrim(p_payload->>'skills'),''),
      expectativas=nullif(btrim(p_payload->>'expectations'),''),como_conheceu=nullif(btrim(p_payload->>'discoverySource'),''),
      experiencia_voluntariado=nullif(p_payload->>'previousVolunteering',''),
      canais_comunicacao=array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),
      ideia_projeto=nullif(btrim(p_payload->>'projectIdea'),''),
      uso_imagem_autorizado=case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized' = 'null'::jsonb
        then null else (p_payload->>'imageUseAuthorized')::boolean end,
      historia_afapan=nullif(btrim(p_payload->>'afapanStory'),''),
      inicio_atividades_mes=(p_payload->>'activityStartMonth')::smallint,inicio_atividades_ano=(p_payload->>'activityStartYear')::smallint,
      responsavel_nome=nullif(btrim(p_payload->>'guardianName'),''),responsavel_telefone=nullif(btrim(p_payload->>'guardianPhone'),''),
      responsavel_telefone_normalizado=nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),
      responsavel_autorizou=coalesce((p_payload->>'guardianAuthorized')::boolean,false),
      status=coalesce(p_payload->>'status',status),validado_por=case when p_payload->>'status'='ativo' then auth.uid() else validado_por end,
      validado_em=case when p_payload->>'status'='ativo' then now() else validado_em end
    where id=p_id returning id into v_id;
  end if;

  insert into public.volunteer_availability(volunteer_id,frequencia)
  values(v_id,p_payload->>'frequency')
  on conflict(volunteer_id) do update
    set frequencia=excluded.frequencia,dias=null,turnos=null,observacoes=null;
  delete from public.volunteer_interests where volunteer_id=v_id;
  insert into public.volunteer_interests(volunteer_id,atividade)
  select v_id,value
  from jsonb_array_elements_text(p_payload->'activities');

  if v_is_new then
    insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem) values
      (v_id,'privacidade',v_settings.privacy_version,v_settings.privacy_text,'assistido'),
      (v_id,'participacao',v_settings.participation_version,v_settings.participation_text,'assistido');
    if (p_payload->>'birthDate')::date > current_date - interval '18 years' then
      insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem)
      values(v_id,'responsavel','1','Autorização do responsável confirmada no cadastro assistido.','assistido');
    end if;
  end if;
  return v_id;
end;
$$;

-- Protege também chamadas antigas ou jobs residuais: não altera nenhum dado.
create or replace function public.process_expired_volunteer_campaigns()
returns integer security definer language plpgsql set search_path = '' as $$
begin
  return 0;
end;
$$;

create or replace function public.purge_old_volunteer_submission_attempts()
returns integer security definer language plpgsql set search_path = '' as $$
declare v_count integer;
begin
  delete from public.volunteer_public_submission_attempts
  where criado_em < now() - interval '24 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.submit_permanent_volunteer_registration(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.submit_permanent_volunteer_registration(jsonb,text,text) to service_role;
revoke all on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) to authenticated;
revoke all on function public.process_expired_volunteer_campaigns() from public,anon,authenticated;
grant execute on function public.process_expired_volunteer_campaigns() to service_role;
revoke all on function public.purge_old_volunteer_submission_attempts() from public,anon,authenticated;
grant execute on function public.purge_old_volunteer_submission_attempts() to service_role;

-- Revoga todas as assinaturas legadas conhecidas pelo nome, sem apagar definições.
do $$
declare v_function record;
begin
  for v_function in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in ('submit_volunteer_registration','save_volunteer_campaign')
  loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',v_function.signature);
  end loop;
end;
$$;

-- pg_cron é opcional. Não instala extensão nem remove jobs de outros módulos.
do $$
declare v_job record;
begin
  if to_regclass('cron.job') is not null then
    for v_job in execute
      'select jobid from cron.job where jobname in (''process-expired-volunteer-campaigns'',''purge-old-volunteer-submission-attempts'')'
    loop
      perform cron.unschedule(v_job.jobid);
    end loop;
    perform cron.schedule(
      'purge-old-volunteer-submission-attempts','15 3 * * *',
      'select public.purge_old_volunteer_submission_attempts();'
    );
  end if;
end;
$$;

commit;
