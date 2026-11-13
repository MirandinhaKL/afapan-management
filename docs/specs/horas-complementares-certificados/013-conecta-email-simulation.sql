-- Fila de teste isolada dos estados de entrega real.
begin;

create table public.conecta_email_simulations (
  outbox_id uuid primary key references public.conecta_email_outbox,
  status text not null check (status in ('claimed','accepted','failed','uncertain','cancelled')),
  attempt_count integer not null check (attempt_count > 0),
  next_attempt_at timestamptz not null default now(),
  lease uuid,
  lease_until timestamptz
);
alter table public.conecta_email_simulations enable row level security;
revoke all on public.conecta_email_simulations from public, anon, authenticated, service_role;
alter table public.conecta_email_attempts
  add column simulated boolean not null default false,
  add column reconciliation_note text;

create function public.conecta_claim_email_simulation(p_lease uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare job_id uuid;
begin
  if p_lease is null then raise exception 'Reserva inválida' using errcode='22023'; end if;
  with expired as (
    select outbox_id from public.conecta_email_simulations
    where status='claimed' and lease_until<=now()
    order by lease_until limit 25 for update skip locked
  ), recovered as (
    update public.conecta_email_simulations s set status='uncertain',lease=null,lease_until=null
    from expired e where e.outbox_id=s.outbox_id returning s.outbox_id
  )
  insert into public.conecta_email_attempts(outbox_id,result,simulated)
    select outbox_id,'uncertain',true from recovered;

  select e.id into job_id from public.conecta_email_outbox e
    left join public.conecta_email_simulations s on s.outbox_id=e.id
    where e.status='queued' and e.next_attempt_at<=now()
      and (s.outbox_id is null or (s.status='failed' and s.attempt_count<4 and s.next_attempt_at<=now()))
    order by e.next_attempt_at,e.id limit 1 for update of e skip locked;
  if not found then return null; end if;
  insert into public.conecta_email_simulations(outbox_id,status,attempt_count,lease,lease_until)
    values(job_id,'claimed',1,p_lease,now()+interval '2 minutes')
    on conflict(outbox_id) do update
      set status='claimed',attempt_count=public.conecta_email_simulations.attempt_count+1,
        lease=p_lease,lease_until=now()+interval '2 minutes'
      where public.conecta_email_simulations.status='failed'
        and public.conecta_email_simulations.attempt_count<4
        and public.conecta_email_simulations.next_attempt_at<=now()
    returning outbox_id into job_id;
  return job_id;
end $$;

create function public.conecta_email_simulation_context(p_id uuid,p_lease uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'purpose',e.purpose,'eventKey',e.event_key,'recipient',e.recipient,'reason',e.payload->>'reason',
    'correctionId',t.id,'tokenHash',t.token_hash,'signedKey',c.signed_key,'signedHash',c.signed_sha256,
    'code',c.code,'name',c.snapshot->>'name','modality',c.snapshot->>'modality'
  )
  from public.conecta_email_simulations s
  join public.conecta_email_outbox e on e.id=s.outbox_id and e.status='queued'
  join public.conecta_applications a on a.id=e.application_id and a.email=e.recipient
  left join public.conecta_decisions d on d.application_id=a.id and d.revision=a.revision
  left join public.conecta_certificates c on c.id=e.certificate_id and c.decision_id=d.id
  left join public.conecta_correction_tokens t on t.application_id=a.id and t.revision=a.revision
    and e.event_key='correction:'||t.id
  where s.outbox_id=p_id and s.lease=p_lease and s.status='claimed' and s.lease_until>now()
    and case e.purpose
      when 'certificate' then a.status='approved' and c.published_at is not null and c.invalidated_at is null
      when 'resend' then a.status='approved' and c.published_at is not null and c.invalidated_at is null
      when 'rejection' then a.status='rejected' and d.decision='rejected' and e.event_key='rejection:'||d.id
      when 'correction' then a.status='returned' and t.expires_at>now() and t.consumed_at is null
      else false
    end;
$$;

create function public.conecta_finish_email_simulation(p_id uuid,p_lease uuid,p_result text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if p_result is null or p_result not in ('accepted','failed','uncertain','cancelled') then
    raise exception 'Resultado inválido' using errcode='22023';
  end if;
  update public.conecta_email_simulations set status=p_result,lease=null,lease_until=null,
    next_attempt_at=now()+make_interval(mins => 1 << least(attempt_count-1,3))
    where outbox_id=p_id and status='claimed' and lease=p_lease and lease_until>now();
  if not found then return false; end if;
  if p_result<>'cancelled' then
    insert into public.conecta_email_attempts(outbox_id,result,simulated) values(p_id,p_result,true);
  end if;
  return true;
end $$;

create function public.conecta_reconcile_email_simulation(p_id uuid,p_result text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  if p_result is null or p_result not in ('accepted','failed') or coalesce(length(btrim(p_note)),0) not between 1 and 3000 then
    raise exception 'Informe o resultado e a evidência da conferência' using errcode='22023';
  end if;
  update public.conecta_email_simulations set status=p_result,next_attempt_at=now()
    where outbox_id=p_id and status='uncertain';
  if not found then return false; end if;
  insert into public.conecta_email_attempts(outbox_id,result,simulated,reconciliation_note)
    values(p_id,p_result,true,btrim(p_note));
  return true;
end $$;

revoke all on function public.conecta_claim_email_simulation(uuid),public.conecta_email_simulation_context(uuid,uuid),
  public.conecta_finish_email_simulation(uuid,uuid,text),public.conecta_reconcile_email_simulation(uuid,text,text)
  from public,anon,authenticated,service_role;
grant execute on function public.conecta_claim_email_simulation(uuid),public.conecta_email_simulation_context(uuid,uuid),
  public.conecta_finish_email_simulation(uuid,uuid,text),public.conecta_reconcile_email_simulation(uuid,text,text) to service_role;

commit;
