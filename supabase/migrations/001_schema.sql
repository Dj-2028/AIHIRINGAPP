-- ============================================================
-- SkillVelocity — Full Schema Migration (001)
-- Run once in Supabase SQL Editor
-- ============================================================
-- PREREQUISITE (do this BEFORE running this script):
--   Dashboard → Database → Extensions → search "vector" → Enable
-- ─── Extensions ─────────────────────────────────────────────
-- On Supabase Cloud, pgvector is registered as "vector" (not "pgvector")
create extension if not exists "vector";
create extension if not exists "uuid-ossp";

-- ─── organizations ──────────────────────────────────────────
create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  plan       text not null default 'free'
               check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

-- ─── users (extends auth.users) ─────────────────────────────
create table if not exists users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text unique not null,
  role       text not null check (role in ('recruiter', 'candidate', 'admin')),
  org_id     uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a users row on Supabase auth signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── candidates ─────────────────────────────────────────────
create table if not exists candidates (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique not null references users(id) on delete cascade,
  velocity_score    float check (velocity_score >= 0 and velocity_score <= 100),
  skills_per_year   float,
  cohort_percentile float check (cohort_percentile >= 0 and cohort_percentile <= 100),
  last_calculated   timestamptz,
  created_at        timestamptz not null default now()
);

-- ─── skills (master catalog + embeddings) ───────────────────
create table if not exists skills (
  id          text primary key,
  name        text not null unique,
  category    text,
  embedding   vector(768),   -- Gemini text-embedding-004 → 768 dims
  created_at  timestamptz not null default now()
);

create index if not exists skills_embedding_idx on skills
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── skill_adjacency ────────────────────────────────────────
create table if not exists skill_adjacency (
  id          uuid primary key default gen_random_uuid(),
  skill_a     text not null references skills(id) on delete cascade,
  skill_b     text not null references skills(id) on delete cascade,
  similarity  float not null check (similarity >= 0 and similarity <= 1),
  updated_at  timestamptz not null default now(),
  unique (skill_a, skill_b)
);

create index if not exists skill_adjacency_a_idx on skill_adjacency(skill_a, similarity desc);
create index if not exists skill_adjacency_b_idx on skill_adjacency(skill_b, similarity desc);

-- ─── skill_entries ──────────────────────────────────────────
create table if not exists skill_entries (
  id             uuid primary key default gen_random_uuid(),
  candidate_id   uuid not null references candidates(id) on delete cascade,
  skill_name     text not null,
  skill_id       text references skills(id) on delete set null,
  learned_from   date not null,
  learned_to     date,
  days_to_learn  int generated always as (
                   case
                     when learned_to is not null
                     then (learned_to - learned_from)
                     else null
                   end
                 ) stored,
  source         text not null default 'self-reported'
                   check (source in ('self-reported', 'github', 'coursera', 'linkedin')),
  created_at     timestamptz not null default now()
);

create index if not exists skill_entries_candidate_id_idx on skill_entries(candidate_id);

-- ─── jobs ───────────────────────────────────────────────────
create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  posted_by       uuid not null references users(id),
  title           text not null,
  description     text,
  required_skills jsonb not null default '[]',
  nice_to_have    jsonb not null default '[]',
  seniority       text check (seniority in ('junior', 'mid', 'senior', 'lead', 'any')),
  status          text not null default 'open'
                    check (status in ('draft', 'open', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists jobs_org_id_idx on jobs(org_id);
create index if not exists jobs_status_idx on jobs(status);

-- ─── applications ───────────────────────────────────────────
create table if not exists applications (
  id                uuid primary key default gen_random_uuid(),
  candidate_id      uuid not null references candidates(id) on delete cascade,
  job_id            uuid not null references jobs(id) on delete cascade,
  adjacency_score   float check (adjacency_score >= 0 and adjacency_score <= 100),
  velocity_score    float check (velocity_score >= 0 and velocity_score <= 100),
  hybrid_score      float generated always as (
                      (coalesce(adjacency_score, 0) * 0.4) +
                      (coalesce(velocity_score,  0) * 0.6)
                    ) stored,
  rank              int,
  status            text not null default 'applied'
                      check (status in ('applied','shortlisted','interview','offered','hired','rejected')),
  bias_check        jsonb,
  explanation_chain jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (candidate_id, job_id)
);

create index if not exists applications_job_hybrid_idx on applications(job_id, hybrid_score desc);
create index if not exists applications_candidate_idx  on applications(candidate_id);

-- ─── Row Level Security ─────────────────────────────────────
alter table organizations   enable row level security;
alter table users           enable row level security;
alter table candidates      enable row level security;
alter table skill_entries   enable row level security;
alter table skills          enable row level security;
alter table skill_adjacency enable row level security;
alter table jobs            enable row level security;
alter table applications    enable row level security;

-- Helper: get current user's role
create or replace function current_user_role()
returns text language sql security definer stable as $$
  select role from users where id = auth.uid();
$$;

-- Helper: get current user's org_id
create or replace function current_user_org()
returns uuid language sql security definer stable as $$
  select org_id from users where id = auth.uid();
$$;

-- organizations: org members can read their own org
create policy "org_members_read_own_org" on organizations
  for select using (id = current_user_org());

create policy "admin_insert_org" on organizations
  for insert with check (true);

-- users: read own row; recruiter/admin can read org members
create policy "users_read_own" on users
  for select using (id = auth.uid());

create policy "users_update_own" on users
  for update using (id = auth.uid());

create policy "recruiter_read_org_users" on users
  for select using (
    current_user_role() in ('recruiter', 'admin')
    and org_id = current_user_org()
  );

-- candidates: own row; recruiters can read applicants to their jobs
create policy "candidates_read_own" on candidates
  for select using (user_id = auth.uid());

create policy "candidates_insert_own" on candidates
  for insert with check (user_id = auth.uid());

create policy "candidates_update_own" on candidates
  for update using (user_id = auth.uid());

create policy "recruiter_read_applicants" on candidates
  for select using (
    current_user_role() = 'recruiter' and
    id in (
      select candidate_id from applications
      where job_id in (
        select id from jobs where org_id = current_user_org()
      )
    )
  );

-- skill_entries: candidates manage own; recruiters read applicants'
create policy "candidates_own_skill_entries" on skill_entries
  for all using (
    candidate_id in (select id from candidates where user_id = auth.uid())
  );

create policy "recruiter_read_skill_entries" on skill_entries
  for select using (
    current_user_role() = 'recruiter' and
    candidate_id in (
      select candidate_id from applications
      where job_id in (select id from jobs where org_id = current_user_org())
    )
  );

-- skills: everyone can read; admin can write
create policy "skills_read_all" on skills
  for select using (true);

create policy "admin_manage_skills" on skills
  for all using (current_user_role() = 'admin');

-- skill_adjacency: everyone can read; admin can write
create policy "adjacency_read_all" on skill_adjacency
  for select using (true);

create policy "admin_manage_adjacency" on skill_adjacency
  for all using (current_user_role() = 'admin');

-- jobs: org members manage; candidates read open jobs
create policy "org_members_manage_jobs" on jobs
  for all using (org_id = current_user_org());

create policy "candidates_read_open_jobs" on jobs
  for select using (status = 'open');

-- applications: candidates see own; recruiters see org's
create policy "candidates_own_applications" on applications
  for all using (
    candidate_id in (select id from candidates where user_id = auth.uid())
  );

create policy "recruiter_org_applications" on applications
  for all using (
    job_id in (select id from jobs where org_id = current_user_org())
  );
