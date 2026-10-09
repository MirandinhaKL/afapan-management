-- SOMENTE LEITURA. Capturar resultados antes/depois em local protegido.
-- Pré-verificação: objetos, políticas, grants, catálogo e assinaturas atuais.
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename like 'volunteer%';
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename like 'volunteer%';
select table_name, grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name like 'volunteer%';
select conrelid::regclass, conname, pg_get_constraintdef(oid)
from pg_constraint where connamespace = 'public'::regnamespace
and conrelid::regclass::text like '%volunteer%';
select p.oid::regprocedure as signature, p.prosecdef, p.proconfig, p.proacl,
pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
 'submit_volunteer_registration','submit_permanent_volunteer_registration',
 'save_volunteer_campaign','save_assisted_volunteer',
 'process_expired_volunteer_campaigns','purge_old_volunteer_submission_attempts');
select status, campaign_id, count(*) from public.volunteers group by status, campaign_id;
-- Capturar também contagens das tabelas relacionadas retornadas acima;
-- comparar antes de qualquer criação de registros para teste.
select to_regclass('public.volunteer_registration_settings') as settings,
to_regclass('cron.job') as optional_jobs;

-- Pós-verificação: executar somente quando 006 estiver aplicada.
select id, privacy_text, privacy_version, participation_text, participation_version
from public.volunteer_registration_settings;
select p.oid::regprocedure as signature, r.rolname,
has_function_privilege(r.rolname,p.oid,'EXECUTE') as can_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
cross join pg_roles r
where n.nspname='public' and r.rolname in ('anon','authenticated','service_role')
and p.proname in ('submit_volunteer_registration','submit_permanent_volunteer_registration',
'save_volunteer_campaign','save_assisted_volunteer','purge_old_volunteer_submission_attempts');

-- Opcional: executar somente se to_regclass('cron.job') retornar objeto.
-- Inspecionar todos os jobs para detectar comandos personalizados antigos.
-- select jobid, jobname, schedule, command, active from cron.job;
