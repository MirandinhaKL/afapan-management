-- Migração aditiva do módulo de voluntários AFAPAN.
-- Não executa exclusões em tabelas existentes.

begin;

create table if not exists public.volunteer_campaigns (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  public_token uuid not null default gen_random_uuid() unique,
  prazo timestamptz not null,
  ativa boolean not null default false,
  privacy_text text not null,
  privacy_version text not null,
  participation_text text not null,
  participation_version text not null,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (btrim(nome) <> ''),
  check (btrim(privacy_text) <> '' and btrim(privacy_version) <> ''),
  check (btrim(participation_text) <> '' and btrim(participation_version) <> '')
);

create unique index if not exists volunteer_campaigns_one_active_idx
  on public.volunteer_campaigns ((ativa)) where ativa;

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.volunteer_campaigns(id) on delete set null,
  nome text not null,
  sobrenome text not null,
  data_nascimento date not null,
  telefone text not null,
  telefone_normalizado text not null,
  email text,
  rua text,
  numero text,
  complemento text,
  bairro text not null,
  cidade text not null,
  estado text,
  profissao text,
  habilidades text,
  expectativas text,
  como_conheceu text,
  experiencia_voluntariado text,
  canais_comunicacao text[] not null default '{}',
  ideia_projeto text,
  uso_imagem_autorizado boolean,
  historia_afapan text,
  inicio_atividades_mes smallint,
  inicio_atividades_ano smallint,
  responsavel_nome text,
  responsavel_telefone text,
  responsavel_telefone_normalizado text,
  responsavel_autorizou boolean not null default false,
  status text not null default 'aguardando_validacao',
  origem text not null,
  validado_por uuid references auth.users(id) on delete set null,
  validado_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  arquivado_em timestamptz,
  arquivado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (btrim(nome) <> '' and btrim(sobrenome) <> ''),
  check (data_nascimento <= current_date),
  check (btrim(bairro) <> '' and btrim(cidade) <> ''),
  check (status in ('aguardando_validacao','ativo','sem_confirmacao','inativo')),
  check (origem in ('publico','assistido')),
  check (experiencia_voluntariado is null or experiencia_voluntariado in ('atualmente','anteriormente','nunca')),
  check (canais_comunicacao <@ array['instagram','facebook','radio_tv_jornal','site','whatsapp','nao_acompanho']::text[]),
  check (
    (inicio_atividades_mes is null and inicio_atividades_ano is null)
    or (
      inicio_atividades_mes between 1 and 12
      and inicio_atividades_ano between 1900 and extract(year from current_date)::integer
      and make_date(inicio_atividades_ano, inicio_atividades_mes, 1) <= date_trunc('month', current_date)::date
    )
  ),
  check (
    data_nascimento <= current_date - interval '18 years'
    or (
      nullif(btrim(responsavel_nome), '') is not null
      and nullif(btrim(responsavel_telefone_normalizado), '') is not null
      and responsavel_autorizou
    )
  )
);

create unique index if not exists volunteers_active_phone_idx
  on public.volunteers (telefone_normalizado) where arquivado_em is null;
create index if not exists volunteers_status_idx on public.volunteers (status) where arquivado_em is null;
create index if not exists volunteers_location_idx on public.volunteers (cidade, bairro) where arquivado_em is null;
create index if not exists volunteers_name_idx on public.volunteers (sobrenome, nome);

alter table public.volunteers add column if not exists expectativas text;
alter table public.volunteers add column if not exists como_conheceu text;
alter table public.volunteers add column if not exists experiencia_voluntariado text;
alter table public.volunteers add column if not exists canais_comunicacao text[] not null default '{}';
alter table public.volunteers add column if not exists ideia_projeto text;
alter table public.volunteers add column if not exists uso_imagem_autorizado boolean;
alter table public.volunteers add column if not exists historia_afapan text;

create table if not exists public.volunteer_availability (
  volunteer_id uuid primary key references public.volunteers(id) on delete cascade,
  dias text[],
  turnos text[],
  frequencia text not null,
  observacoes text,
  check (frequencia in ('diaria','semanal','quinzenal','mensal','eventual'))
);

alter table public.volunteer_availability alter column dias drop not null;
alter table public.volunteer_availability alter column turnos drop not null;
alter table public.volunteer_availability drop constraint if exists volunteer_availability_frequencia_check;
alter table public.volunteer_availability add constraint volunteer_availability_frequencia_check
  check (frequencia in ('diaria','semanal','quinzenal','mensal','eventual'));

create table if not exists public.volunteer_interests (
  volunteer_id uuid not null references public.volunteers(id) on delete cascade,
  atividade text not null,
  outra_descricao text,
  primary key (volunteer_id, atividade),
  check (atividade in ('plantio_mudas','coleta_residuos','limpeza_areas_publicas','retirada_plantas_exoticas','conscientizacao_ambiental','caminhos_residuos','compostagem_escola','ecopontos_bairros','outras','ainda_nao_sei')),
  check (atividade <> 'outras' or nullif(btrim(outra_descricao), '') is not null)
);

create index if not exists volunteer_interests_activity_idx on public.volunteer_interests (atividade);

create table if not exists public.volunteer_consents (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete restrict,
  tipo text not null check (tipo in ('privacidade','participacao','responsavel')),
  versao text not null,
  texto text not null,
  aceito_em timestamptz not null default now(),
  origem text not null check (origem in ('publico','assistido')),
  unique (volunteer_id, tipo, versao)
);

create table if not exists public.volunteer_status_history (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete restrict,
  status_anterior text,
  status_novo text not null,
  origem text not null check (origem in ('publico','usuario','sistema')),
  usuario_id uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.volunteer_audit_log (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteers(id) on delete restrict,
  acao text not null check (acao in ('criar','editar','validar','alterar_status','arquivar','restaurar')),
  origem text not null check (origem in ('publico','usuario','sistema')),
  usuario_id uuid references auth.users(id) on delete set null,
  valores_anteriores jsonb,
  valores_novos jsonb,
  criado_em timestamptz not null default now()
);

create table if not exists public.volunteer_public_submission_attempts (
  id bigint generated always as identity primary key,
  source_hash text not null,
  phone_hash text not null,
  criado_em timestamptz not null default now()
);

create index if not exists volunteer_attempts_window_idx
  on public.volunteer_public_submission_attempts (source_hash, criado_em desc);

create or replace function public.volunteer_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists volunteer_campaigns_touch_updated_at on public.volunteer_campaigns;
create trigger volunteer_campaigns_touch_updated_at before update on public.volunteer_campaigns
for each row execute function public.volunteer_touch_updated_at();
drop trigger if exists volunteers_touch_updated_at on public.volunteers;
create trigger volunteers_touch_updated_at before update on public.volunteers
for each row execute function public.volunteer_touch_updated_at();

create or replace function public.volunteer_audit_changes()
returns trigger security definer language plpgsql set search_path = '' as $$
declare v_action text; v_origin text;
begin
  v_origin := coalesce(nullif(current_setting('app.volunteer_origin', true),''),case when auth.uid() is null then 'publico' else 'usuario' end);
  if tg_op = 'INSERT' then
    v_action := 'criar';
    insert into public.volunteer_status_history(volunteer_id,status_anterior,status_novo,origem,usuario_id)
    values(new.id,null,new.status,v_origin,auth.uid());
  elsif old.arquivado_em is null and new.arquivado_em is not null then v_action := 'arquivar';
  elsif old.arquivado_em is not null and new.arquivado_em is null then v_action := 'restaurar';
  elsif old.status is distinct from new.status then
    v_action := case when new.status = 'ativo' then 'validar' else 'alterar_status' end;
    insert into public.volunteer_status_history(volunteer_id,status_anterior,status_novo,origem,usuario_id)
    values(new.id,old.status,new.status,v_origin,auth.uid());
  else v_action := 'editar'; end if;
  insert into public.volunteer_audit_log(volunteer_id,acao,origem,usuario_id,valores_anteriores,valores_novos)
  values(new.id,v_action,v_origin,auth.uid(),case when tg_op='INSERT' then null else to_jsonb(old) end,to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists volunteers_audit on public.volunteers;
create trigger volunteers_audit after insert or update on public.volunteers
for each row execute function public.volunteer_audit_changes();

drop function if exists public.submit_volunteer_registration(uuid,jsonb,text,text);
create or replace function public.submit_volunteer_registration(
  p_payload jsonb, p_source_hash text, p_phone_hash text
) returns uuid security definer language plpgsql set search_path = '' as $$
declare v_campaign public.volunteer_campaigns%rowtype; v_id uuid; v_birth date; v_phone text; v_origin text := 'publico';
begin
  select * into v_campaign from public.volunteer_campaigns
  where ativa and prazo >= now() for update;
  if not found then raise exception 'FORM_UNAVAILABLE' using errcode='P0002'; end if;
  v_birth := (p_payload->>'birthDate')::date;
  v_phone := p_payload->>'normalizedPhone';
  if v_phone is null or exists(select 1 from public.volunteers where telefone_normalizado=v_phone and arquivado_em is null) then
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
    case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized'='null'::jsonb then null else (p_payload->>'imageUseAuthorized')::boolean end,
    nullif(btrim(p_payload->>'afapanStory'),''),(p_payload->>'activityStartMonth')::smallint,
    (p_payload->>'activityStartYear')::smallint,nullif(btrim(p_payload->>'guardianName'),''),nullif(btrim(p_payload->>'guardianPhone'),''),
    nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),coalesce((p_payload->>'guardianAuthorized')::boolean,false),'aguardando_validacao',v_origin
  ) returning id into v_id;
  insert into public.volunteer_availability(volunteer_id,frequencia) values(v_id,p_payload->>'frequency');
  insert into public.volunteer_interests(volunteer_id,atividade,outra_descricao)
  select v_id,value,nullif(btrim(p_payload->>'otherActivityDescription'),'') from jsonb_array_elements_text(p_payload->'activities');
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

create or replace function public.save_assisted_volunteer(p_id uuid,p_expected_updated_at timestamptz,p_payload jsonb)
returns uuid security definer language plpgsql set search_path = '' as $$
declare v_id uuid; v_current timestamptz; v_is_new boolean := p_id is null;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if v_is_new then
    insert into public.volunteers(nome,sobrenome,data_nascimento,telefone,telefone_normalizado,email,rua,numero,complemento,bairro,cidade,estado,
      profissao,habilidades,expectativas,como_conheceu,experiencia_voluntariado,canais_comunicacao,ideia_projeto,uso_imagem_autorizado,
      historia_afapan,inicio_atividades_mes,inicio_atividades_ano,responsavel_nome,responsavel_telefone,responsavel_telefone_normalizado,
      responsavel_autorizou,status,origem,criado_por,validado_por,validado_em)
    values(btrim(p_payload->>'firstName'),btrim(p_payload->>'lastName'),(p_payload->>'birthDate')::date,p_payload->>'phone',p_payload->>'normalizedPhone',
      nullif(btrim(p_payload->>'email'),''),nullif(btrim(p_payload->>'street'),''),nullif(btrim(p_payload->>'number'),''),nullif(btrim(p_payload->>'complement'),''),
      btrim(p_payload->>'neighborhood'),btrim(p_payload->>'city'),nullif(btrim(p_payload->>'state'),''),nullif(btrim(p_payload->>'profession'),''),
      nullif(btrim(p_payload->>'skills'),''),nullif(btrim(p_payload->>'expectations'),''),nullif(btrim(p_payload->>'discoverySource'),''),
      nullif(p_payload->>'previousVolunteering',''),array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),
      nullif(btrim(p_payload->>'projectIdea'),''),case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized'='null'::jsonb then null else (p_payload->>'imageUseAuthorized')::boolean end,
      nullif(btrim(p_payload->>'afapanStory'),''),(p_payload->>'activityStartMonth')::smallint,(p_payload->>'activityStartYear')::smallint,
      nullif(btrim(p_payload->>'guardianName'),''),nullif(btrim(p_payload->>'guardianPhone'),''),nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),
      coalesce((p_payload->>'guardianAuthorized')::boolean,false),coalesce(p_payload->>'status','ativo'),'assistido',auth.uid(),auth.uid(),now()) returning id into v_id;
  else
    select atualizado_em into v_current from public.volunteers where id=p_id for update;
    if not found then raise exception 'VOLUNTEER_NOT_FOUND' using errcode='P0002'; end if;
    if v_current <> p_expected_updated_at then raise exception 'VOLUNTEER_CONFLICT' using errcode='40001'; end if;
    update public.volunteers set nome=btrim(p_payload->>'firstName'),sobrenome=btrim(p_payload->>'lastName'),data_nascimento=(p_payload->>'birthDate')::date,
      telefone=p_payload->>'phone',telefone_normalizado=p_payload->>'normalizedPhone',email=nullif(btrim(p_payload->>'email'),''),rua=nullif(btrim(p_payload->>'street'),''),
      numero=nullif(btrim(p_payload->>'number'),''),complemento=nullif(btrim(p_payload->>'complement'),''),bairro=btrim(p_payload->>'neighborhood'),
      cidade=btrim(p_payload->>'city'),estado=nullif(btrim(p_payload->>'state'),''),profissao=nullif(btrim(p_payload->>'profession'),''),habilidades=nullif(btrim(p_payload->>'skills'),''),
      expectativas=nullif(btrim(p_payload->>'expectations'),''),como_conheceu=nullif(btrim(p_payload->>'discoverySource'),''),
      experiencia_voluntariado=nullif(p_payload->>'previousVolunteering',''),
      canais_comunicacao=array(select jsonb_array_elements_text(coalesce(p_payload->'communicationChannels','[]'::jsonb))),
      ideia_projeto=nullif(btrim(p_payload->>'projectIdea'),''),
      uso_imagem_autorizado=case when p_payload->'imageUseAuthorized' is null or p_payload->'imageUseAuthorized'='null'::jsonb then null else (p_payload->>'imageUseAuthorized')::boolean end,
      historia_afapan=nullif(btrim(p_payload->>'afapanStory'),''),
      inicio_atividades_mes=(p_payload->>'activityStartMonth')::smallint,inicio_atividades_ano=(p_payload->>'activityStartYear')::smallint,
      responsavel_nome=nullif(btrim(p_payload->>'guardianName'),''),responsavel_telefone=nullif(btrim(p_payload->>'guardianPhone'),''),
      responsavel_telefone_normalizado=nullif(btrim(p_payload->>'normalizedGuardianPhone'),''),responsavel_autorizou=coalesce((p_payload->>'guardianAuthorized')::boolean,false),
      status=coalesce(p_payload->>'status',status),validado_por=case when p_payload->>'status'='ativo' then auth.uid() else validado_por end,
      validado_em=case when p_payload->>'status'='ativo' then now() else validado_em end
    where id=p_id returning id into v_id;
  end if;
  insert into public.volunteer_availability(volunteer_id,frequencia)
  values(v_id,p_payload->>'frequency')
  on conflict(volunteer_id) do update set frequencia=excluded.frequencia,dias=null,turnos=null,observacoes=null;
  delete from public.volunteer_interests where volunteer_id=v_id;
  insert into public.volunteer_interests(volunteer_id,atividade,outra_descricao)
  select v_id,value,nullif(btrim(p_payload->>'otherActivityDescription'),'') from jsonb_array_elements_text(p_payload->'activities');
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

create or replace function public.set_volunteer_status(p_id uuid,p_expected_updated_at timestamptz,p_status text)
returns uuid security definer language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if p_status not in ('aguardando_validacao','ativo','sem_confirmacao','inativo') then raise exception 'INVALID_STATUS' using errcode='22023'; end if;
  update public.volunteers set status=p_status,validado_por=case when p_status='ativo' then auth.uid() else validado_por end,
    validado_em=case when p_status='ativo' then now() else validado_em end
  where id=p_id and atualizado_em=p_expected_updated_at;
  if not found then raise exception 'VOLUNTEER_CONFLICT' using errcode='40001'; end if;
  return p_id;
end;
$$;

create or replace function public.set_volunteer_archived(p_id uuid,p_expected_updated_at timestamptz,p_archived boolean)
returns uuid security definer language plpgsql set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  update public.volunteers set arquivado_em=case when p_archived then now() else null end,
    arquivado_por=case when p_archived then auth.uid() else null end
  where id=p_id and atualizado_em=p_expected_updated_at;
  if not found then raise exception 'VOLUNTEER_CONFLICT' using errcode='40001'; end if;
  return p_id;
end;
$$;

create or replace function public.process_expired_volunteer_campaigns()
returns integer security definer language plpgsql set search_path = '' as $$
declare v_count integer;
begin
  perform set_config('app.volunteer_origin','sistema',true);
  update public.volunteers v set status='sem_confirmacao'
  from public.volunteer_campaigns c
  where v.campaign_id=c.id and c.prazo < now() and v.status='aguardando_validacao' and v.arquivado_em is null;
  get diagnostics v_count = row_count;
  update public.volunteer_campaigns set ativa=false where ativa and prazo < now();
  delete from public.volunteer_public_submission_attempts where criado_em < now()-interval '24 hours';
  return v_count;
end;
$$;

create or replace function public.save_volunteer_campaign(
  p_id uuid,p_expected_updated_at timestamptz,p_name text,p_deadline timestamptz,p_active boolean,
  p_privacy_text text,p_privacy_version text,p_participation_text text,p_participation_version text
) returns uuid security definer language plpgsql set search_path = '' as $$
declare v_id uuid; v_current timestamptz;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if nullif(btrim(p_name),'') is null or p_deadline is null then raise exception 'INVALID_CAMPAIGN' using errcode='22023'; end if;
  if p_active then update public.volunteer_campaigns set ativa=false where ativa and id is distinct from p_id; end if;
  if p_id is null then
    insert into public.volunteer_campaigns(nome,prazo,ativa,privacy_text,privacy_version,participation_text,participation_version,criado_por)
    values(btrim(p_name),p_deadline,p_active,p_privacy_text,p_privacy_version,p_participation_text,p_participation_version,auth.uid())
    returning id into v_id;
  else
    select atualizado_em into v_current from public.volunteer_campaigns where id=p_id for update;
    if not found then raise exception 'CAMPAIGN_NOT_FOUND' using errcode='P0002'; end if;
    if v_current <> p_expected_updated_at then raise exception 'CAMPAIGN_CONFLICT' using errcode='40001'; end if;
    update public.volunteer_campaigns set nome=btrim(p_name),prazo=p_deadline,ativa=p_active,privacy_text=p_privacy_text,
      privacy_version=p_privacy_version,participation_text=p_participation_text,participation_version=p_participation_version
    where id=p_id returning id into v_id;
  end if;
  return v_id;
end;
$$;

alter table public.volunteer_campaigns enable row level security;
alter table public.volunteers enable row level security;
alter table public.volunteer_availability enable row level security;
alter table public.volunteer_interests enable row level security;
alter table public.volunteer_consents enable row level security;
alter table public.volunteer_status_history enable row level security;
alter table public.volunteer_audit_log enable row level security;
alter table public.volunteer_public_submission_attempts enable row level security;

create policy "Authenticated users can view volunteer campaigns" on public.volunteer_campaigns for select to authenticated using (true);
create policy "Authenticated users can view volunteers" on public.volunteers for select to authenticated using (true);
create policy "Authenticated users can view volunteer availability" on public.volunteer_availability for select to authenticated using (true);
create policy "Authenticated users can view volunteer interests" on public.volunteer_interests for select to authenticated using (true);
create policy "Authenticated users can view volunteer consents" on public.volunteer_consents for select to authenticated using (true);
create policy "Authenticated users can view volunteer status history" on public.volunteer_status_history for select to authenticated using (true);
create policy "Authenticated users can view volunteer audit" on public.volunteer_audit_log for select to authenticated using (true);

revoke all on function public.submit_volunteer_registration(jsonb,text,text) from public,anon,authenticated;
grant execute on function public.submit_volunteer_registration(jsonb,text,text) to service_role;
revoke all on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) from public,anon;
revoke all on function public.set_volunteer_status(uuid,timestamptz,text) from public,anon;
revoke all on function public.set_volunteer_archived(uuid,timestamptz,boolean) from public,anon;
grant execute on function public.save_assisted_volunteer(uuid,timestamptz,jsonb) to authenticated;
grant execute on function public.set_volunteer_status(uuid,timestamptz,text) to authenticated;
grant execute on function public.set_volunteer_archived(uuid,timestamptz,boolean) to authenticated;
revoke all on function public.save_volunteer_campaign(uuid,timestamptz,text,timestamptz,boolean,text,text,text,text) from public,anon;
grant execute on function public.save_volunteer_campaign(uuid,timestamptz,text,timestamptz,boolean,text,text,text,text) to authenticated;
revoke all on function public.process_expired_volunteer_campaigns() from public,anon,authenticated;
grant execute on function public.process_expired_volunteer_campaigns() to service_role;

commit;
