-- Aplicar depois de validar 001-volunteers-schema.sql.
-- Agenda o processamento diário de campanhas expiradas.

create extension if not exists pg_cron with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'process-expired-volunteer-campaigns';

select cron.schedule(
  'process-expired-volunteer-campaigns',
  '15 3 * * *',
  $$select public.process_expired_volunteer_campaigns();$$
);

-- Verificação:
-- select jobid, jobname, schedule, active from cron.job
-- where jobname = 'process-expired-volunteer-campaigns';
