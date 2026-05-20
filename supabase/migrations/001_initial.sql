-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Artifacts
create table artifacts (
  id               uuid primary key default uuid_generate_v4(),
  slug             text unique not null,
  type             text not null check (type in ('skill','command','agent','prompt','web-skill')),
  surface          text not null check (surface in ('claude-code','claude-ai','both')),
  status           text not null default 'draft'
                     check (status in ('draft','pending_review','published','rejected')),
  title            text not null,
  description      text not null,
  content          text not null default '',
  tags             text[] not null default '{}',
  department       text not null,
  metadata         jsonb not null default '{}',
  submitted_by     text not null,            -- role/department label, never name or email
  submitter_user_id uuid references auth.users(id) on delete set null, -- for RLS ownership
  reviewed_by      text,                     -- role label
  current_version  integer not null default 0,
  pii_flagged      boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz
);

-- Full-text search column, maintained by trigger (generated columns require IMMUTABLE,
-- but to_tsvector with a named config is STABLE in PostgreSQL)
alter table artifacts add column fts tsvector;

create index artifacts_fts_idx on artifacts using gin(fts);

create function artifacts_set_fts() returns trigger language plpgsql as $$
begin
  new.fts := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.content, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '')
  );
  return new;
end;
$$;

create trigger artifacts_fts_trigger
  before insert or update on artifacts
  for each row execute function artifacts_set_fts();
create index artifacts_status_idx     on artifacts(status);
create index artifacts_type_idx       on artifacts(type);
create index artifacts_department_idx on artifacts(department);
create index artifacts_surface_idx    on artifacts(surface);

-- Artifact versions (snapshot on every approval)
create table artifact_versions (
  id           uuid primary key default uuid_generate_v4(),
  artifact_id  uuid not null references artifacts(id) on delete cascade,
  version      integer not null,
  content      text not null,
  metadata     jsonb not null default '{}',
  change_note  text,
  published_by text not null,  -- role label
  created_at   timestamptz not null default now(),
  unique (artifact_id, version)
);

-- Review notes (approved / changes_requested / rejected)
create table review_notes (
  id          uuid primary key default uuid_generate_v4(),
  artifact_id uuid not null references artifacts(id) on delete cascade,
  body        text not null default '',
  action      text not null check (action in ('approved','changes_requested','rejected')),
  created_at  timestamptz not null default now()
);

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger artifacts_updated_at
  before update on artifacts
  for each row execute function set_updated_at();

-- Row Level Security
alter table artifacts         enable row level security;
alter table artifact_versions enable row level security;
alter table review_notes      enable row level security;

-- Published artifacts: readable by all authenticated users
create policy "published artifacts readable by authed users"
  on artifacts for select
  to authenticated
  using (status = 'published');

-- Non-published: readable by the submitter only
-- Maintainer uses service role (bypasses RLS) for review queue
create policy "non-published artifacts readable by submitter"
  on artifacts for select
  to authenticated
  using (
    status in ('draft', 'pending_review', 'rejected')
    and submitter_user_id = auth.uid()
  );

-- Authenticated users can submit (insert) in pending_review status
create policy "authenticated users can submit"
  on artifacts for insert
  to authenticated
  with check (status = 'pending_review');

-- Artifact versions readable by all authenticated users
create policy "artifact versions readable by authed users"
  on artifact_versions for select
  to authenticated
  using (true);

-- Review notes readable by all authenticated users
-- (submitters need to see rejection reasons on their own submissions)
create policy "review notes readable by authed users"
  on review_notes for select
  to authenticated
  using (true);

-- Service role bypasses RLS — used by review handler for all write operations
-- and by the maintainer review queue (select on non-published artifacts)

-- Departments are a client-side constant in src/lib/departments.ts, not a DB table in v1.
