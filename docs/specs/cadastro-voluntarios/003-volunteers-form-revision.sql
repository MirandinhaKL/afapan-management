-- Revisão incremental do formulário de voluntários AFAPAN.
-- Pré-requisito: 001-volunteers-schema.sql já aplicado.
-- Preserva tabelas, registros, auditoria, consentimentos e políticas RLS existentes.
-- A transação inteira é revertida automaticamente se qualquer instrução falhar.

begin;

alter table public.volunteers add column if not exists expectativas text;
alter table public.volunteers add column if not exists como_conheceu text;
alter table public.volunteers add column if not exists experiencia_voluntariado text;
alter table public.volunteers add column if not exists canais_comunicacao text[] not null default '{}';
alter table public.volunteers add column if not exists ideia_projeto text;
alter table public.volunteers add column if not exists uso_imagem_autorizado boolean;
alter table public.volunteers add column if not exists historia_afapan text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'volunteers_experiencia_voluntariado_check'
      and conrelid = 'public.volunteers'::regclass
  ) then
    alter table public.volunteers add constraint volunteers_experiencia_voluntariado_check
      check (experiencia_voluntariado is null or experiencia_voluntariado in ('atualmente','anteriormente','nunca'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'volunteers_canais_comunicacao_check'
      and conrelid = 'public.volunteers'::regclass
  ) then
    alter table public.volunteers add constraint volunteers_canais_comunicacao_check
      check (canais_comunicacao <@ array['instagram','facebook','radio_tv_jornal','site','whatsapp','nao_acompanho']::text[]);
  end if;
end;
$$;

-- As colunas antigas são preservadas apenas por compatibilidade com dados de teste.
alter table public.volunteer_availability alter column dias drop not null;
alter table public.volunteer_availability alter column turnos drop not null;
alter table public.volunteer_availability drop constraint if exists volunteer_availability_frequencia_check;
alter table public.volunteer_availability add constraint volunteer_availability_frequencia_check
  check (frequencia in ('diaria','semanal','quinzenal','mensal','eventual'));
create index if not exists volunteer_availability_frequency_idx
  on public.volunteer_availability (frequencia);

-- Nova assinatura sem token. A assinatura antiga permanece durante a transição do deploy.
create or replace function public.submit_volunteer_registration(
  p_payload jsonb, p_source_hash text, p_phone_hash text
) returns uuid security definer language plpgsql set search_path = '' as $$
declare
  v_campaign public.volunteer_campaigns%rowtype;
  v_id uuid;
  v_birth date;
  v_phone text;
  v_origin text := 'publico';
begin
  select * into v_campaign
  from public.volunteer_campaigns
  where ativa and prazo >= now()
  for update;
  if not found then raise exception 'FORM_UNAVAILABLE' using errcode='P0002'; end if;

  v_birth := (p_payload->>'birthDate')::date;
  v_phone := p_payload->>'normalizedPhone';
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
    v_campaign.id,btrim(p_payload->>'firstName'),btrim(p_payload->>'lastName'),v_birth,p_payload->>'phone',v_phone,
    nullif(btrim(p_payload->>'email'),''),nullif(btrim(p_payload->>'street'),''),nullif(btrim(p_payload->>'number'),''),
    nullif(btrim(p_payload->>'complement'),''),btrim(p_payload->>'neighborhood'),btrim(p_payload->>'city'),nullif(btrim(p_payload->>'state'),''),
    nullif(btrim(p_payload->>'profession'),''),nullif(btrim(p_payload->>'skills'),''),nullif(btrim(p_payload->>'expectations'),''),
    nullif(btrim(p_payload->>'discoverySource'),''),nullif(p_payload->>'previousVolunteering',''),
    array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),nullif(btrim(p_payload->>'projectIdea'),''),
    case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized' = 'null'::jsonb
      then null else (p_payload->>'imageUseAuthorized')::boolean end,
    nullif(btrim(p_payload->>'afapanStory'),''),(p_payload->>'activityStartMonth')::smallint,
    (p_payload->>'activityStartYear')::smallint,nullif(btrim(p_payload->>'guardianName'),''),nullif(btrim(p_payload->>'guardianPhone'),''),
    nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),coalesce((p_payload->>'guardianAuthorized')::boolean,false),'aguardando_validacao',v_origin
  ) returning id into v_id;

  insert into public.volunteer_availability(volunteer_id,frequencia)
  values(v_id,p_payload->>'frequency');
  insert into public.volunteer_interests(volunteer_id,atividade,outra_descricao)
  select v_id,value,nullif(btrim(p_payload->>'otherActivityDescription'),'')
  from jsonb_array_elements_text(p_payload->'activities');
  insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem) values
    (v_id,'privacidade',v_campaign.privacy_version,v_campaign.privacy_text,v_origin),
    (v_id,'participacao',v_campaign.participation_version,v_campaign.participation_text,v_origin);
  if v_birth > current_date - interval '18 years' then
    insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem)
    values(v_id,'responsavel','1',coalesce(p_payload->>'guardianConsentText','Autorização do responsável'),v_origin);
  end if;
  return v_id;
end;
$$;

create or replace function public.save_assisted_volunteer(
  p_id uuid,p_expected_updated_at timestamptz,p_payload jsonb
) returns uuid security definer language plpgsql set search_path = '' as $$
declare
  v_id uuid;
  v_current timestamptz;
  v_is_new boolean := p_id is null;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_is_new then
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
    if v_current <> p_expected_updated_at then raise exception 'VOLUNTEER_CONFLICT' using errcode='40001'; end if;
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
  insert into public.volunteer_interests(volunteer_id,atividade,outra_descricao)
  select v_id,value,nullif(btrim(p_payload->>'otherActivityDescription'),'')
  from jsonb_array_elements_text(p_payload->'activities');

  if v_is_new then
    insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem) values
      (v_id,'privacidade','1','Declaro que li e estou ciente de que a AFAPAN utilizará os dados informados neste formulário para organizar ações de voluntariado, manter contato comigo e administrar o cadastro de voluntários, conforme o aviso de privacidade apresentado.','assistido'),
      (v_id,'participacao','1','Confirmo que desejo continuar participando como voluntário(a) da AFAPAN e autorizo o contato pelos canais informados, inclusive pelo WhatsApp, bem como minha inclusão em um novo grupo de voluntários ativos.','assistido');
    if (p_payload->>'birthDate')::date > current_date - interval '18 years' then
      insert into public.volunteer_consents(volunteer_id,tipo,versao,texto,origem)
      values(v_id,'responsavel','1','Autorização do responsável confirmada no cadastro assistido.','assistido');
    end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.submit_volunteer_registration(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.submit_volunteer_registration(jsonb,text,text) to service_role;
revoke all on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) to authenticated;

commit;

-- Verificação sugerida após a execução:
-- select column_name, data_type from information_schema.columns
-- where table_schema='public' and table_name='volunteers'
--   and column_name in ('expectativas','como_conheceu','experiencia_voluntariado','canais_comunicacao','ideia_projeto','uso_imagem_autorizado','historia_afapan');
-- select pg_get_function_identity_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid=p.pronamespace
-- where n.nspname='public' and p.proname='submit_volunteer_registration';
