# SkillVelocity — Backend Schema

## Database: Supabase (PostgreSQL + pgvector)

Enable extensions first:
```sql
create extension if not exists "pgvector";
create extension if not exists "uuid-ossp";
```

---

## Tables

### `organizations`
```sql
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  plan       text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);
```

---

### `users`
Extends Supabase `auth.users`. Created via trigger on signup.

```sql
create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  email      text unique not null,
  role       text not null check (role in ('recruiter', 'candidate', 'admin')),
  org_id     uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create user row on Supabase auth signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'candidate'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

### `candidates`
One row per candidate user. Stores computed scores.

```sql
create table candidates (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid unique not null references users(id) on delete cascade,
  velocity_score    float check (velocity_score >= 0 and velocity_score <= 100),
  skills_per_year   float,
  cohort_percentile float check (cohort_percentile >= 0 and cohort_percentile <= 100),
  last_calculated   timestamptz,
  created_at        timestamptz not null default now()
);
```

---

### `skill_entries`
The learning history timeline. Core input for velocity calculation.

```sql
create table skill_entries (
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

create index skill_entries_candidate_id_idx on skill_entries(candidate_id);
```

---

### `skills`
Master skill catalog. Embeddings stored as pgvector for similarity search.

```sql
create table skills (
  id          text primary key,          -- e.g. "KS1200B" (Lightcast ID) or slug
  name        text not null unique,
  category    text,                       -- e.g. "Programming", "Data", "DevOps"
  embedding   vector(1536),              -- text-embedding-3-small output
  created_at  timestamptz not null default now()
);

-- IVFFlat index for fast approximate nearest-neighbor search
create index skills_embedding_idx on skills
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

---

### `skill_adjacency`
Precomputed pairwise similarity between skills. Populated by batch job.

```sql
create table skill_adjacency (
  id          uuid primary key default gen_random_uuid(),
  skill_a     text not null references skills(id) on delete cascade,
  skill_b     text not null references skills(id) on delete cascade,
  similarity  float not null check (similarity >= 0 and similarity <= 1),
  updated_at  timestamptz not null default now(),
  unique (skill_a, skill_b)
);

create index skill_adjacency_a_idx on skill_adjacency(skill_a, similarity desc);
create index skill_adjacency_b_idx on skill_adjacency(skill_b, similarity desc);
```

---

### `jobs`
Job postings created by recruiters.

```sql
create table jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  posted_by       uuid not null references users(id),
  title           text not null,
  description     text,
  required_skills jsonb not null default '[]',
  -- shape: [{ skill_id: string, skill_name: string, weight: number }]
  nice_to_have    jsonb not null default '[]',
  seniority       text check (seniority in ('junior', 'mid', 'senior', 'lead', 'any')),
  status          text not null default 'open'
                    check (status in ('draft', 'open', 'closed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index jobs_org_id_idx on jobs(org_id);
create index jobs_status_idx on jobs(status);
```

---

### `applications`
One row per candidate-job pair. Stores all computed scores and explanations.

```sql
create table applications (
  id                    uuid primary key default gen_random_uuid(),
  candidate_id          uuid not null references candidates(id) on delete cascade,
  job_id                uuid not null references jobs(id) on delete cascade,

  -- Scores
  adjacency_score       float check (adjacency_score >= 0 and adjacency_score <= 100),
  velocity_score        float check (velocity_score >= 0 and velocity_score <= 100),
  hybrid_score          float generated always as (
                          (coalesce(adjacency_score, 0) * 0.4) +
                          (coalesce(velocity_score, 0) * 0.6)
                        ) stored,
  rank                  int,

  -- Status
  status                text not null default 'applied'
                          check (status in ('applied','shortlisted','interview','offered','hired','rejected')),

  -- Explainability
  bias_check            jsonb,
  explanation_chain     jsonb,

  -- Timestamps
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (candidate_id, job_id)
);

-- Critical index for leaderboard query performance
create index applications_job_hybrid_idx on applications(job_id, hybrid_score desc);
create index applications_candidate_idx on applications(candidate_id);
```

---

## Row Level Security Policies

```sql
-- Enable RLS on all tables
alter table organizations   enable row level security;
alter table users           enable row level security;
alter table candidates      enable row level security;
alter table skill_entries   enable row level security;
alter table jobs            enable row level security;
alter table applications    enable row level security;

-- Helper function: get current user's role
create or replace function current_user_role()
returns text language sql security definer stable as $$
  select role from users where id = auth.uid();
$$;

-- Helper function: get current user's org_id
create or replace function current_user_org()
returns uuid language sql security definer stable as $$
  select org_id from users where id = auth.uid();
$$;

-- users: read own row; admin reads all in org
create policy "users_read_own" on users
  for select using (id = auth.uid());

create policy "admin_read_org_users" on users
  for select using (
    current_user_role() = 'admin' and org_id = current_user_org()
  );

-- candidates: read own profile
create policy "candidates_read_own" on candidates
  for select using (user_id = auth.uid());

-- recruiters can read candidates who applied to their jobs
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

-- skill_entries: candidates manage own entries; recruiters read applicants'
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

-- jobs: recruiters in org read/write; candidates read open jobs
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
```

---

## Supabase Edge Functions

### `recalculate-scores`
Triggered via webhook after `skill_entries` insert/update.

```typescript
// supabase/functions/recalculate-scores/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const { candidateId } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Fetch all skill entries for candidate
  const { data: entries } = await supabase
    .from('skill_entries')
    .select('*')
    .eq('candidate_id', candidateId)

  // 2. Calculate velocity
  const yearsSpan = calcYearsSpan(entries)
  const skillsPerYear = entries.length / yearsSpan
  const avgDaysToLearn = avg(entries.map(e => e.days_to_learn).filter(Boolean))

  // 3. Get cohort percentile (compare against all candidates)
  const { data: allCandidates } = await supabase
    .from('candidates')
    .select('skills_per_year')
  const percentile = calcPercentile(skillsPerYear, allCandidates.map(c => c.skills_per_year))

  const velocityScore = Math.round(percentile)

  // 4. Update candidates row
  await supabase
    .from('candidates')
    .update({
      velocity_score: velocityScore,
      skills_per_year: skillsPerYear,
      cohort_percentile: percentile,
      last_calculated: new Date().toISOString()
    })
    .eq('id', candidateId)

  return new Response(JSON.stringify({ velocityScore }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### `embed-skill`
Triggered via webhook after `skills` insert.

```typescript
// supabase/functions/embed-skill/index.ts
Deno.serve(async (req) => {
  const { skillId, skillName } = await req.json()

  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: skillName
    })
  })

  const { data } = await embeddingRes.json()
  const embedding = data[0].embedding

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase
    .from('skills')
    .update({ embedding })
    .eq('id', skillId)

  // Recompute adjacency for this skill vs all others
  const { data: allSkills } = await supabase
    .from('skills')
    .select('id, name, embedding')
    .neq('id', skillId)

  const adjacencyRows = allSkills
    .filter(s => s.embedding)
    .map(s => ({
      skill_a: skillId,
      skill_b: s.id,
      similarity: cosineSimilarity(embedding, s.embedding)
    }))
    .filter(r => r.similarity >= 0.6)

  await supabase
    .from('skill_adjacency')
    .upsert(adjacencyRows, { onConflict: 'skill_a,skill_b' })

  return new Response(JSON.stringify({ embedded: true }))
})
```

---

## Key SQL Queries

### Leaderboard: ranked applications for a job
```sql
select
  a.id,
  a.rank,
  a.hybrid_score,
  a.adjacency_score,
  a.velocity_score,
  a.status,
  a.bias_check,
  a.explanation_chain,
  c.id as candidate_id,
  u.full_name,
  c.velocity_score as candidate_velocity,
  c.cohort_percentile
from applications a
join candidates c on c.id = a.candidate_id
join users u on u.id = c.user_id
where a.job_id = $1
order by a.hybrid_score desc;
```

### Adjacency: best matching skill for a candidate vs a required skill
```sql
select
  sa.similarity,
  s_candidate.name as candidate_skill,
  s_required.name as required_skill
from skill_adjacency sa
join skills s_required on s_required.id = sa.skill_a
join skills s_candidate on s_candidate.id = sa.skill_b
where
  sa.skill_a = $required_skill_id
  and sa.skill_b in (
    select skill_id from skill_entries where candidate_id = $candidate_id
  )
order by sa.similarity desc
limit 1;
```

### Velocity percentile: rank a candidate vs cohort
```sql
select
  percent_rank() over (order by skills_per_year) * 100 as percentile
from candidates
where id = $candidate_id;
```

---

## Seed Data (Hackathon)

```sql
-- Seed skills
insert into skills (id, name, category) values
  ('rust',          'Rust',               'Systems'),
  ('cpp',           'C++',                'Systems'),
  ('c',             'C',                  'Systems'),
  ('systems-prog',  'Systems Programming','Systems'),
  ('python',        'Python',             'General'),
  ('typescript',    'TypeScript',         'Web'),
  ('javascript',    'JavaScript',         'Web'),
  ('react',         'React',              'Web'),
  ('nodejs',        'Node.js',            'Web'),
  ('go',            'Go',                 'Systems'),
  ('wasm',          'WebAssembly',        'Systems');

-- Seed adjacency (manual for hackathon, replace with computed in prod)
insert into skill_adjacency (skill_a, skill_b, similarity) values
  ('rust', 'cpp',          0.87),
  ('rust', 'c',            0.82),
  ('rust', 'systems-prog', 0.79),
  ('rust', 'go',           0.74),
  ('rust', 'wasm',         0.71),
  ('typescript', 'javascript', 0.93),
  ('typescript', 'react',      0.78),
  ('python', 'go',         0.61),
  ('cpp',   'c',           0.91),
  ('react', 'nodejs',      0.69);

-- Seed org and recruiter
insert into organizations (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp');
```