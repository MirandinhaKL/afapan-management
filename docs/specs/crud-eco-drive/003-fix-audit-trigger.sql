-- Correção para ambientes onde 001-eco-drive-crud.sql já foi aplicado.
-- Substitui somente a função do gatilho de auditoria; não altera nem apaga dados.

begin;

create or replace function public.eco_drive_write_audit()
returns trigger security definer language plpgsql set search_path = '' as $$
declare
  v_campaign_id uuid;
  v_entity text;
  v_entity_id uuid;
  v_action text;
begin
  if tg_table_name = 'eco_drive_campaigns' then
    v_entity := 'campanha';
    v_campaign_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_entity_id := v_campaign_id;
  else
    v_entity := 'material';
    v_campaign_id := case when tg_op = 'DELETE' then old.campanha_id else new.campanha_id end;
    v_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'criar';
  elsif v_entity = 'campanha' then
    if old.arquivado_em is null and new.arquivado_em is not null then
      v_action := 'arquivar';
    elsif old.arquivado_em is not null and new.arquivado_em is null then
      v_action := 'restaurar';
    else
      v_action := 'editar';
    end if;
  else
    v_action := 'editar';
  end if;

  insert into public.eco_drive_audit_log (
    campanha_id, entidade, entidade_id, acao, usuario_id,
    valores_anteriores, valores_novos
  ) values (
    v_campaign_id, v_entity, v_entity_id, v_action, auth.uid(),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    to_jsonb(new)
  );

  return new;
end;
$$;

commit;

-- Verificação após executar:
-- select public.create_eco_drive_campaign(...) não é necessário para testar.
-- Cadastre uma campanha pela aplicação e confirme a auditoria com:
-- select entidade, acao, campanha_id, usuario_id, criado_em
-- from public.eco_drive_audit_log
-- order by criado_em desc
-- limit 10;
