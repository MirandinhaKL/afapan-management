-- Conecta AFAPAN: fundação local. Não aplicar remotamente sem autorização.
-- Nenhuma tabela de outros módulos é modificada.
begin;
set local lock_timeout = '5s';

create table public.conecta_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (length(btrim(name)) between 1 and 160)
);
create table public.conecta_modalities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.conecta_projects,
  slug text not null unique,
  active boolean not null default true
);
create table public.conecta_modality_versions (
  id uuid primary key default gen_random_uuid(),
  modality_id uuid not null references public.conecta_modalities,
  version integer not null check (version > 0),
  name text not null check (length(btrim(name)) between 1 and 160),
  description text not null default '',
  mode text not null check (mode in ('checklist','free')),
  unique (modality_id, version),
  unique (id, modality_id)
);
create table public.conecta_tasks (
  id uuid primary key default gen_random_uuid(),
  modality_version_id uuid not null references public.conecta_modality_versions,
  position integer not null check (position > 0),
  label text not null check (btrim(label) <> ''),
  minutes integer not null check (minutes > 0),
  unique (modality_version_id, position)
);
create table public.conecta_applications (
  id uuid primary key default gen_random_uuid(),
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  birth_date date not null,
  name text not null,
  email text not null,
  phone text not null,
  institution text not null,
  course text not null,
  instagram text,
  modality_id uuid not null,
  modality_version_id uuid not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','returned')),
  revision integer not null default 1 check (revision > 0),
  approved_minutes integer check (approved_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (modality_version_id, modality_id) references public.conecta_modality_versions(id, modality_id),
  unique (cpf, modality_id, starts_on, ends_on),
  check (birth_date <= starts_on and starts_on <= ends_on),
  check ((status = 'approved') = (approved_minutes is not null))
);
create table public.conecta_application_revisions (
  application_id uuid not null references public.conecta_applications,
  revision integer not null check (revision > 0),
  report text not null check (btrim(report) <> ''),
  declared_tasks uuid[] not null default '{}',
  declared_minutes integer check (declared_minutes > 0),
  created_at timestamptz not null default now(),
  primary key (application_id, revision)
);
create table public.conecta_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  revision integer not null,
  object_key text not null unique,
  mime text not null,
  bytes bigint not null check (bytes > 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  foreign key (application_id, revision) references public.conecta_application_revisions
);
create table public.conecta_decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null,
  revision integer not null,
  actor uuid not null references auth.users,
  decision text not null check (decision in ('approved','rejected','returned')),
  recognized_tasks uuid[] not null default '{}',
  minutes integer check (minutes > 0),
  reason text,
  created_at timestamptz not null default now(),
  foreign key (application_id, revision) references public.conecta_application_revisions,
  unique (application_id, revision),
  check ((decision = 'approved') = (minutes is not null)),
  check (decision = 'approved' or coalesce(btrim(reason), '') <> '')
);
create table public.conecta_certificates (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.conecta_decisions,
  replaces uuid references public.conecta_certificates,
  code text not null unique,
  snapshot jsonb not null,
  generated_key text unique,
  signed_key text unique,
  signed_sha256 text,
  published_at timestamptz,
  invalidated_at timestamptz,
  invalidation_reason text,
  check (published_at is null or (signed_key is not null and signed_sha256 is not null)),
  check (invalidated_at is null or coalesce(btrim(invalidation_reason), '') <> '')
);
create unique index conecta_one_current_certificate on public.conecta_certificates(decision_id) where invalidated_at is null;
create table public.conecta_email_outbox (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.conecta_applications,
  certificate_id uuid references public.conecta_certificates,
  event_key text not null unique,
  purpose text not null check (purpose in ('certificate','resend','correction','rejection')),
  recipient text not null,
  status text not null default 'queued' check (status in ('queued','claimed','accepted','failed','uncertain','cancelled')),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  provider_reference text
);
create table public.conecta_email_attempts (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.conecta_email_outbox,
  result text not null check (result in ('accepted','failed','uncertain')),
  created_at timestamptz not null default now()
);

-- Fail closed: no public, browser, or service access is granted by this
-- foundation. Subsequent migrations must grant only explicit policies/RPCs.
do $$
declare t text;
begin
  foreach t in array array[
    'projects','modalities','modality_versions','tasks','applications',
    'application_revisions','attachments','decisions','certificates','email_outbox','email_attempts'
  ] loop
    execute format('alter table public.%I enable row level security', 'conecta_' || t);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', 'conecta_' || t);
  end loop;
end $$;
commit;
