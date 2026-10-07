-- Torna opcional a descrição de "Outras atividades".
-- Preserva tabelas, registros, RLS, permissões e demais restrições.

begin;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.volunteer_interests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%atividade%outras%'
      and pg_get_constraintdef(oid) ilike '%outra_descricao%'
  loop
    execute format(
      'alter table public.volunteer_interests drop constraint %I',
      v_constraint.conname
    );
  end loop;
end;
$$;

commit;

-- Verificação somente leitura após a execução: deve retornar zero linhas.
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.volunteer_interests'::regclass
--   and contype = 'c'
--   and pg_get_constraintdef(oid) ilike '%atividade%outras%'
--   and pg_get_constraintdef(oid) ilike '%outra_descricao%';

-- Reversão, caso a regra antiga precise ser restaurada:
-- alter table public.volunteer_interests
--   add constraint volunteer_interests_other_description_check
--   check (atividade <> 'outras' or nullif(btrim(outra_descricao), '') is not null) not valid;
