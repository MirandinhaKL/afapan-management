begin;

alter table public.participantes alter column email drop not null;
alter table public.compostagem_inscricoes add column turma_historica_id uuid references public.turmas(id) on delete cascade;
create unique index compostagem_inscricoes_historicas_idx
  on public.compostagem_inscricoes (turma_historica_id, assinatura)
  where turma_historica_id is not null;

create or replace function public.processar_importacao_compostagem(
  p_usuario uuid, p_turma uuid, p_linhas jsonb, p_confirmadas jsonb default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  turma_nome text;
  linha jsonb;
  resultado jsonb := '[]'::jsonb;
  item jsonb;
  anterior jsonb;
  pessoa public.participantes%rowtype;
  encontrados uuid[];
  nome_historico text;
  telefone_historico text;
  vinculo_historico uuid;
  vinculo uuid;
  assinatura_anterior text;
  acao text;
  motivo text;
  mudou boolean := false;
begin
  if not exists (select 1 from public.compostagem_importadores where usuario_id = p_usuario) then
    return jsonb_build_object('proibido', true);
  end if;
  if p_confirmadas is not null then
    lock table public.participantes, public.participantes_turmas in share row exclusive mode;
  end if;
  select nome into turma_nome from public.turmas where id = p_turma for key share;
  if not found then return jsonb_build_object('turmaAusente', true); end if;

  for linha in select value from jsonb_array_elements(p_linhas) loop
    vinculo := null;
    vinculo_historico := null;
    motivo := null;
    acao := 'novo';
    if linha->>'email' is not null then
      select array_agg(id) into encontrados from public.participantes
        where lower(btrim(email)) = linha->>'email';
    else
      nome_historico := lower(regexp_replace(btrim(concat_ws(' ', linha->>'nome', linha->>'sobrenome')), '[[:space:]]+', ' ', 'g'));
      telefone_historico := linha->>'telefone';
      select i.vinculo_id into vinculo_historico
        from public.compostagem_inscricoes i
        where i.turma_historica_id = p_turma and i.assinatura = linha->>'assinatura';
      encontrados := null;
      if vinculo_historico is not null then
        select array[p.participante_id] into encontrados
          from public.participantes_turmas p where p.id = vinculo_historico;
      elsif exists (
        select 1 from jsonb_array_elements(p_linhas) x
        where x->'linha' <> linha->'linha' and (
          x->>'assinatura' = linha->>'assinatura'
          or (telefone_historico is not null and x->>'telefone' = telefone_historico)
          or lower(regexp_replace(btrim(concat_ws(' ', x->>'nome', x->>'sobrenome')), '[[:space:]]+', ' ', 'g')) = nome_historico
        )
      ) then
        motivo := 'Possivel duplicidade no arquivo. Revise nome e telefone.';
      else
        select array_agg(p.id) into encontrados from public.participantes p
          where lower(regexp_replace(btrim(concat_ws(' ', p.nome, p.sobrenome)), '[[:space:]]+', ' ', 'g')) = nome_historico
             or regexp_replace(p.telefone, '[^0-9]', '', 'g') = telefone_historico;
        if cardinality(encontrados) = 1 and not exists (
          select 1 from public.participantes p where p.id = encontrados[1]
            and lower(regexp_replace(btrim(concat_ws(' ', p.nome, p.sobrenome)), '[[:space:]]+', ' ', 'g')) = nome_historico
            and regexp_replace(p.telefone, '[^0-9]', '', 'g') = telefone_historico
        ) then
          motivo := 'Nome ou telefone coincide parcialmente com um cadastro.';
          encontrados := null;
        elsif cardinality(encontrados) > 1 then
          motivo := 'Mais de um cadastro corresponde ao nome ou telefone.';
          encontrados := null;
        end if;
      end if;
    end if;
    if vinculo_historico is not null then
      acao := 'importado';
      vinculo := vinculo_historico;
    elsif cardinality(encontrados) > 1 then
      motivo := 'Mais de um cadastro tem este e-mail.';
    elsif cardinality(encontrados) = 1 then
      select * into pessoa from public.participantes where id = encontrados[1];
      if pessoa.ativo is distinct from true then
        motivo := 'O cadastro correspondente está inativo.';
      elsif lower(regexp_replace(btrim(concat_ws(' ', pessoa.nome, pessoa.sobrenome)), '[[:space:]]+', ' ', 'g'))
          <> lower(regexp_replace(btrim(concat_ws(' ', linha->>'nome', linha->>'sobrenome')), '[[:space:]]+', ' ', 'g')) then
        motivo := 'O nome diverge do cadastro com este e-mail.';
      else
        acao := 'vincular';
        select id into vinculo from public.participantes_turmas
          where participante_id = pessoa.id and turma_id = p_turma;
        select assinatura into assinatura_anterior from public.compostagem_inscricoes where vinculo_id = vinculo;
        if found then
          if assinatura_anterior = linha->>'assinatura' then
            acao := 'importado';
          else
            motivo := 'A inscrição anterior tem dados diferentes.';
          end if;
        end if;
      end if;
    end if;
    if motivo is not null then acao := 'pendente'; end if;
    item := jsonb_build_object('linha', linha->'linha', 'acao', acao, 'motivo', motivo,
      'participante', encontrados[1], 'vinculo', vinculo);
    resultado := resultado || jsonb_build_array(item);
    if p_confirmadas is not null then
      anterior := p_confirmadas->(linha->>'linha');
      if acao = 'importado' then
        if anterior is not null and anterior->>'acao' <> 'novo'
          and anterior->>'participante' is distinct from item->>'participante' then mudou := true; end if;
      elsif anterior is distinct from item and (anterior is not null or acao <> 'pendente') then
        mudou := true;
      end if;
    end if;
  end loop;

  if p_confirmadas is null or mudou then
    return jsonb_build_object('linhas', resultado, 'mudou', mudou);
  end if;

  for item in select value from jsonb_array_elements(resultado) loop
    acao := item->>'acao';
    if acao in ('pendente', 'importado') then continue; end if;
    select value into strict linha from jsonb_array_elements(p_linhas) where value->'linha' = item->'linha';
    if acao = 'novo' then
      insert into public.participantes(nome, sobrenome, email, telefone, endereco, turma)
        values (linha->>'nome', linha->>'sobrenome', linha->>'email', linha->>'telefone', linha->>'endereco', turma_nome)
        returning id into pessoa.id;
    else
      pessoa.id := (item->>'participante')::uuid;
    end if;
    vinculo := (item->>'vinculo')::uuid;
    if vinculo is null then
      insert into public.participantes_turmas(participante_id, turma_id)
        values (pessoa.id, p_turma) returning id into vinculo;
    end if;
    insert into public.compostagem_inscricoes(vinculo_id, respondido_em, geracao_residuos, intencao, cpf, assinatura, turma_historica_id)
      values (vinculo, (linha->>'respondidoEm')::timestamptz, linha->>'geracao', linha->>'intencao', linha->>'cpf', linha->>'assinatura', case when linha->>'email' is null then p_turma end);
  end loop;
  return jsonb_build_object('linhas', resultado, 'mudou', false);
end;
$$;

revoke all on function public.processar_importacao_compostagem(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.processar_importacao_compostagem(uuid, uuid, jsonb, jsonb) to service_role;

commit;
