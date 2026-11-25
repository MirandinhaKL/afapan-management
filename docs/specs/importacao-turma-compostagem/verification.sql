-- Executar somente em banco local de teste com o esquema e a migração da iniciativa.
-- Cria dados fictícios dentro de uma transação que será revertida.
begin;

do $$
declare
  usuario uuid := gen_random_uuid();
  turma uuid := gen_random_uuid();
  linhas jsonb := '[{"linha":2,"nome":"Ana","sobrenome":"Silva","email":"compostagem-ficticia@example.test","cpf":"01234567890","assinatura":"ficticia-1"}]';
  previa jsonb;
  confirmadas jsonb;
  resultado jsonb;
begin
  assert not has_table_privilege('authenticated', 'public.compostagem_inscricoes', 'select');
  assert not has_table_privilege('anon', 'public.compostagem_inscricoes', 'select');
  assert not has_function_privilege('authenticated', 'public.processar_importacao_compostagem(uuid,uuid,jsonb,jsonb)', 'execute');
  assert has_function_privilege('service_role', 'public.processar_importacao_compostagem(uuid,uuid,jsonb,jsonb)', 'execute');

  resultado := public.processar_importacao_compostagem(usuario, turma, linhas);
  assert resultado->>'proibido' = 'true';

  insert into auth.users(id, email) values (usuario, 'operador-compostagem@example.test');
  insert into public.compostagem_importadores(usuario_id) values (usuario);
  insert into public.turmas(id, nome) values (turma, 'Turma de teste');
  previa := public.processar_importacao_compostagem(usuario, turma, linhas);
  assert previa->'linhas'->0->>'acao' = 'novo';
  assert not exists(select 1 from public.participantes where email = linhas->0->>'email');
  confirmadas := jsonb_build_object('2', previa->'linhas'->0);

  begin
    resultado := public.processar_importacao_compostagem(usuario, turma, jsonb_set(linhas, '{0,cpf}', '"invalido"'), confirmadas);
    raise exception 'Valor inválido deveria reverter a transação de gravação.';
  exception when check_violation then
    null;
  end;
  assert not exists(select 1 from public.participantes where email = linhas->0->>'email');
  assert not exists(select 1 from public.participantes_turmas where turma_id = turma);

  resultado := public.processar_importacao_compostagem(usuario, turma, linhas, confirmadas);
  assert resultado->>'mudou' = 'false';
  resultado := public.processar_importacao_compostagem(usuario, turma, linhas, confirmadas);
  assert resultado->'linhas'->0->>'acao' = 'importado';
  assert (select count(*) from public.participantes_turmas where turma_id = turma) = 1;
  assert exists (
    select 1 from public.compostagem_inscricoes i
      join public.participantes_turmas v on v.id = i.vinculo_id
      where v.turma_id = turma and i.cpf = '01234567890'
  );
  resultado := public.processar_importacao_compostagem(usuario, turma, jsonb_set(linhas, '{0,assinatura}', '"ficticia-2"'), confirmadas);
  assert resultado->>'mudou' = 'true';
  assert resultado->'linhas'->0->>'acao' = 'pendente';
end;
$$;

-- Executar após aplicar também 002-importacao-historica.sql.
do $$
declare
  operador_id uuid := gen_random_uuid();
  turma_id_teste uuid := gen_random_uuid();
  linhas jsonb := '[{"linha":2,"nome":"Ana","sobrenome":"Histórica","email":null,"telefone":null,"respondidoEm":null,"assinatura":"historico-ficticio"}]';
  previa jsonb;
  confirmadas jsonb;
  resultado jsonb;
begin
  insert into auth.users(id, email) values (operador_id, 'operador-historico@example.test');
  insert into public.compostagem_importadores(usuario_id) values (operador_id);
  insert into public.turmas(id, nome) values (turma_id_teste, 'Turma histórica de teste');
  previa := public.processar_importacao_compostagem(operador_id, turma_id_teste, linhas);
  assert previa->'linhas'->0->>'acao' = 'novo';
  confirmadas := jsonb_build_object('2', previa->'linhas'->0);
  resultado := public.processar_importacao_compostagem(operador_id, turma_id_teste, linhas, confirmadas);
  assert resultado->>'mudou' = 'false';
  resultado := public.processar_importacao_compostagem(operador_id, turma_id_teste, linhas, confirmadas);
  assert resultado->'linhas'->0->>'acao' = 'importado';
  assert (select count(*) from public.participantes_turmas where turma_id = turma_id_teste) = 1;
  assert exists (
    select 1 from public.compostagem_inscricoes i
      join public.participantes_turmas v on v.id = i.vinculo_id
      join public.participantes p on p.id = v.participante_id
      where v.turma_id = turma_id_teste and p.email is null and i.respondido_em is null
  );
  resultado := public.processar_importacao_compostagem(
    operador_id, turma_id_teste, jsonb_set(linhas, '{0,assinatura}', '"outra-inscricao"')
  );
  assert resultado->'linhas'->0->>'acao' = 'pendente';
end;
$$;

-- Executar após aplicar 003-telefone-compartilhado.sql.
do $$
declare
  operador uuid := gen_random_uuid();
  destino uuid := gen_random_uuid();
  outro_destino uuid := gen_random_uuid();
  linhas jsonb := '[{"linha":2,"nome":"Lia","telefone":"54990000001","assinatura":"teste-lia"},{"linha":3,"nome":"Caio","telefone":"54990000001","assinatura":"teste-caio"}]';
  previa jsonb;
  confirmadas jsonb;
  resultado jsonb;
begin
  insert into auth.users(id, email) values (operador, 'operador-compartilhado@example.test');
  insert into public.compostagem_importadores(usuario_id) values (operador);
  insert into public.turmas(id, nome) values (destino, 'Telefone compartilhado'), (outro_destino, 'Reuso do cadastro');

  previa := public.processar_importacao_compostagem(operador, destino, linhas);
  assert previa->'linhas'->0->>'acao' = 'novo';
  assert previa->'linhas'->1->>'acao' = 'novo';
  select jsonb_object_agg(item->>'linha', item) into confirmadas
    from jsonb_array_elements(previa->'linhas') as itens(item);
  resultado := public.processar_importacao_compostagem(operador, destino, linhas, confirmadas);
  assert resultado->>'mudou' = 'false';
  resultado := public.processar_importacao_compostagem(operador, destino, linhas, confirmadas);
  assert resultado->'linhas'->0->>'acao' = 'importado';
  assert resultado->'linhas'->1->>'acao' = 'importado';
  assert (select count(distinct participante_id) from public.participantes_turmas where turma_id = destino) = 2;

  resultado := public.processar_importacao_compostagem(operador, outro_destino, linhas);
  assert resultado->'linhas'->0->>'acao' = 'vincular';
  assert resultado->'linhas'->1->>'acao' = 'vincular';
  resultado := public.processar_importacao_compostagem(
    operador, outro_destino, jsonb_build_array(jsonb_set(linhas->0, '{telefone}', '"54990000002"'))
  );
  assert resultado->'linhas'->0->>'acao' = 'pendente';
  insert into public.participantes(nome, telefone, turma) values ('Lia', '54990000001', 'Reuso do cadastro');
  resultado := public.processar_importacao_compostagem(operador, outro_destino, linhas);
  assert resultado->'linhas'->0->>'acao' = 'pendente';
  assert resultado->'linhas'->1->>'acao' = 'vincular';
end;
$$;

rollback;
