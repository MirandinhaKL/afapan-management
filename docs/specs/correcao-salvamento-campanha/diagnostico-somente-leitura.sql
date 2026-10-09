-- Diagnóstico do timeout de campanha. SOMENTE LEITURA.
-- Executar no SQL Editor do projeto Supabase correto.
-- Não altera banco, não termina sessões e não executa save_volunteer_campaign.
-- As permissões do usuário podem limitar a visibilidade de sessões.
-- Idealmente consultar enquanto a chamada de salvamento estiver aguardando.

-- 1. Definição instalada, configurações e permissões da RPC.
select p.oid::regprocedure as assinatura, p.prosecdef as security_definer,
       p.proconfig as configuracoes, p.proacl as permissoes,
       pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'save_volunteer_campaign';

-- 2. Gatilhos e funções reais da tabela de campanhas.
select t.tgname, pg_get_triggerdef(t.oid) as gatilho,
       pg_get_functiondef(t.tgfoid) as funcao
from pg_trigger t
where t.tgrelid = 'public.volunteer_campaigns'::regclass
  and not t.tgisinternal;

-- 3. Sessões bloqueadas e seus bloqueadores, sem mostrar textos de consultas.
select a.pid, a.state, a.wait_event_type, a.wait_event,
       now() - a.xact_start as duracao_transacao,
       now() - a.query_start as duracao_solicitacao,
       pg_blocking_pids(a.pid) as bloqueadores
from pg_stat_activity a
where a.datname = current_database()
  and a.pid <> pg_backend_pid()
  and (
    cardinality(pg_blocking_pids(a.pid)) > 0
    or a.pid in (
      select unnest(pg_blocking_pids(b.pid))
      from pg_stat_activity b
      where b.datname = current_database()
    )
  )
order by a.xact_start nulls last;

-- 4. Locks associados à tabela de campanhas; não mostra dados das campanhas.
select l.pid, l.locktype, l.mode, l.granted, a.state,
       a.wait_event_type, a.wait_event, now() - a.xact_start as duracao_transacao
from pg_locks l
left join pg_stat_activity a on a.pid = l.pid
where l.relation = 'public.volunteer_campaigns'::regclass
order by l.granted, l.pid;

-- 5. Índices que garantem unicidade de campanha ativa.
select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'volunteer_campaigns';
