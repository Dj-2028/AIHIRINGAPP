# SkillVelocity — Product Requirements Document

**Version:** 1.0  
**Status:** Hackathon Build  
**Stack:** Next.js 15 · Supabase · OpenAI / Sentence-Transformers · NetworkX (Python API)

---

## 1. Problem Statement

Resumes are backward-looking snapshots. They answer "What does this person know today?" but fail to answer the more valuable question: "How fast can this person learn what we need tomorrow?" This causes two failures:

- **False negatives:** Fast learners with adjacent skills get filtered out because they lack an exact keyword.
- **False positives:** Slow learners with a checked box get hired and take months to become productive.

SkillVelocity fixes this by modelling learning trajectory, not just skill inventory.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Predict time-to-productivity | % of recruiters who find the estimate useful | ≥ 70% in user testing |
| Surface overlooked candidates | # of applications where a non-exact-match ranks #1 | ≥ 30% of jobs |
| Reduce bias | Score delta after removing demographic proxies | < 2 points in 95% of cases |
| Explain every decision | Glass-box explanation present on every ranking | 100% |

---

## 3. User Personas

### Recruiter (Primary)
Needs to fill a role fast. Drowning in applicants. Values speed, confidence, and defensibility ("Why did you rank them #1?"). Does not want a black box.

### Candidate (Secondary)
Frustrated that their learning trajectory is invisible. Has learned fast before but doesn't have the exact skill on their CV yet. Wants to be judged on potential.

### HR Admin (Tertiary)
Responsible for compliance and audit trails. Needs bias documentation and explainability logs.

---

## 4. Core Features (MVP — Hackathon Scope)

### F1 — Job Description Ingestion
- Paste or type a JD into a text area
- AI (GPT-4o or local Sentence-Transformers) parses it and extracts: required skills, nice-to-have skills, seniority level
- Skills are mapped to IDs in the Lightcast / custom skill graph
- Output: structured `required_skills` JSON stored on the `jobs` table

### F2 — Candidate Profile Builder
- Candidates fill in a learning timeline (not just skills):
  ```
  Python      — learned Jan 2022, took ~3 months
  React       — learned Aug 2022, took ~2 months
  TypeScript  — learned Mar 2023, took ~1 month
  ```
- Each entry maps to a skill ID
- System calculates `days_to_learn` for each entry

### F3 — Learning Velocity Score Engine
Runs server-side (Next.js API Route or Supabase Edge Function):

```
velocity_score = (avg_skills_per_year × 0.5) + (speed_relative_to_cohort × 0.5)
```

Where:
- `avg_skills_per_year` = total distinct skills / years of history
- `speed_relative_to_cohort` = percentile rank of learning speed vs all candidates in DB

Score stored on `candidates.velocity_score` (0–100).

### F4 — Skill Adjacency Graph
- Nodes = skills from Lightcast taxonomy (or synthetic 500-skill subset for hackathon)
- Edges = cosine similarity of skill embeddings, threshold ≥ 0.7
- Stored in `skill_adjacency` table
- For any job, calculate: `adjacency_score` = max similarity between candidate's skills and each required skill

### F5 — Hybrid Ranking Algorithm
```
hybrid_score = (adjacency_score × 0.4) + (velocity_score × 0.6)
```

All candidates who applied to a job are ranked by `hybrid_score` and stored in `applications.rank`.

### F6 — Glass-Box Explanation Engine
For every application, generate and store `explanation_chain` as JSONB:

```json
{
  "match_score": 84,
  "current_skills": {
    "matched": ["C++", "Systems Programming"],
    "missing": ["Rust"],
    "adjacency_note": "C++ is 87% similar to Rust on skill graph"
  },
  "velocity": {
    "score": 78,
    "skills_per_year": 3.2,
    "cohort_percentile": 91,
    "fastest_acquisition": "TypeScript in 28 days"
  },
  "time_to_productivity": {
    "estimate_weeks": "2–3 weeks",
    "basis": "Previous adjacent skill learned in avg 35 days"
  }
}
```

### F7 — Bias Check
Before finalising score, run a shadow calculation removing: name, university name, graduation year, location.

Store in `applications.bias_check`:
```json
{
  "score_with_demographics": 84,
  "score_without_demographics": 83,
  "delta": 1,
  "status": "PASS",
  "threshold": 5
}
```

Show a green ✓ badge if delta < 5 points.

### F8 — Recruiter Leaderboard UI
- Table view: rank, candidate name, hybrid score, velocity score, adjacency score, time-to-productivity estimate, bias check badge
- Click a row → expand glass-box explanation panel
- Filter by score threshold or velocity percentile

---

## 5. Non-Goals (Post-Hackathon)

- Real-time integrations with LinkedIn or Coursera
- ATS integrations (Greenhouse, Lever)
- Video interview scheduling
- Multi-language JD support
- Mobile app

---

## 6. Tech Stack

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components, API routes, edge functions |
| Styling | Tailwind CSS v4 | Utility-first, fast prototyping |
| UI Components | shadcn/ui | Accessible, unstyled base |
| Charts | Recharts | Learning trajectory graph |
| State | Zustand | Lightweight client state |
| Auth UI | Supabase Auth UI | Pre-built with Supabase session |

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Database | Supabase (PostgreSQL) | Auth + DB + Edge Functions in one |
| Vector search | pgvector (Supabase extension) | Skill embedding similarity |
| API routes | Next.js Route Handlers | Velocity calc, scoring, JD parse |
| AI / NLP | OpenAI GPT-4o-mini | JD skill extraction, explanation generation |
| Embeddings | text-embedding-3-small | Skill graph cosine similarity |
| Job queue | Supabase Edge Functions (Deno) | Async score recalculation |

### Infra
| Layer | Choice |
|---|---|
| Hosting | Vercel (Next.js) |
| DB + Auth | Supabase cloud |
| Env secrets | Vercel environment variables |
| CI | GitHub Actions (build + lint) |

---

## 7. Backend Schema (PostgreSQL / Supabase)

### `organizations`
```sql
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text default 'free',
  created_at  timestamptz default now()
);
```

### `users` (extends Supabase auth.users)
```sql
create table users (
  id          uuid primary key references auth.users(id),
  full_name   text,
  email       text unique not null,
  role        text check (role in ('recruiter','candidate','admin')) not null,
  org_id      uuid references organizations(id),
  created_at  timestamptz default now()
);
```

### `candidates`
```sql
create table candidates (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references users(id) on delete cascade,
  velocity_score      float,
  skills_per_year     float,
  cohort_percentile   float,
  last_calculated     timestamptz,
  created_at          timestamptz default now()
);
```

### `skill_entries`
```sql
create table skill_entries (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid references candidates(id) on delete cascade,
  skill_name      text not null,
  skill_id        text,  -- maps to skills.id
  learned_from    date not null,
  learned_to      date,
  days_to_learn   int generated always as (
                    extract(day from learned_to - learned_from)
                  ) stored,
  source          text,  -- 'self-reported', 'github', 'coursera'
  created_at      timestamptz default now()
);
```

### `skills`
```sql
create table skills (
  id          text primary key,
  name        text not null,
  category    text,
  embedding   vector(1536),  -- pgvector, text-embedding-3-small
  created_at  timestamptz default now()
);

create index on skills using ivfflat (embedding vector_cosine_ops);
```

### `skill_adjacency`
```sql
create table skill_adjacency (
  id              uuid primary key default gen_random_uuid(),
  skill_a         text references skills(id),
  skill_b         text references skills(id),
  similarity      float not null,
  unique(skill_a, skill_b)
);
```

### `jobs`
```sql
create table jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organizations(id),
  posted_by       uuid references users(id),
  title           text not null,
  description     text,
  required_skills jsonb,  -- [{skill_id, skill_name, weight}]
  nice_to_have    jsonb,
  status          text default 'open' check (status in ('open','closed','draft')),
  created_at      timestamptz default now()
);
```

### `applications`
```sql
create table applications (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid references candidates(id),
  job_id              uuid references jobs(id),
  adjacency_score     float,
  velocity_score      float,
  hybrid_score        float generated always as (
                        (adjacency_score * 0.4) + (velocity_score * 0.6)
                      ) stored,
  rank                int,
  status              text default 'applied',
  bias_check          jsonb,
  explanation_chain   jsonb,
  created_at          timestamptz default now(),
  unique(candidate_id, job_id)
);

create index on applications(job_id, hybrid_score desc);
```

### Row Level Security policies
```sql
-- Candidates see only their own applications
create policy "candidates_own_apps" on applications
  for select using (
    candidate_id = (select id from candidates where user_id = auth.uid())
  );

-- Recruiters see only apps for their org's jobs
create policy "recruiter_org_apps" on applications
  for select using (
    job_id in (select id from jobs where org_id = (
      select org_id from users where id = auth.uid()
    ))
  );
```

---

## 8. API Route Design (Next.js Route Handlers)

### `POST /api/jobs/parse`
Input: `{ description: string }`  
Output: `{ required_skills: SkillRef[], nice_to_have: SkillRef[] }`  
Logic: Send JD to GPT-4o-mini with few-shot prompt → extract skill names → look up skill IDs

### `POST /api/candidates/score`
Input: `{ candidateId: string }`  
Output: `{ velocity_score, skills_per_year, cohort_percentile }`  
Logic: Fetch all skill_entries → calculate velocity → update candidates row

### `POST /api/applications/rank`
Input: `{ jobId: string }`  
Output: ranked list of applications  
Logic:
1. Fetch all applications for job
2. For each: query pgvector for max adjacency between candidate skills and required skills
3. Fetch velocity_score
4. Calculate hybrid_score
5. Run bias check (shadow calc without demographic fields)
6. Generate explanation_chain via GPT-4o-mini
7. Upsert all results, update rank

### `GET /api/jobs/[jobId]/leaderboard`
Returns ranked applications with candidate info, scores, bias_check, time_to_productivity estimate

---

## 9. Frontend Pages & Components

### Pages (App Router)

| Route | Description |
|---|---|
| `/` | Landing / marketing page |
| `/auth/login` | Supabase Auth UI |
| `/auth/signup` | Role selection + org creation |
| `/dashboard` | Role-aware home (recruiter vs candidate) |
| `/jobs/new` | JD paste → parsed skills preview → post |
| `/jobs/[id]` | Leaderboard + candidate cards |
| `/jobs/[id]/candidates/[cid]` | Full glass-box report |
| `/profile` | Candidate timeline builder |
| `/admin/skill-graph` | Visualize + edit adjacency map |
| `/admin/bias-log` | Audit trail for all bias checks |

### Key Components

**`<LeaderboardTable />`**
- Sortable columns: rank, hybrid score, velocity score, adjacency, time-to-productivity
- Bias check badge (green ✓ / amber warning)
- Click to expand inline glass-box panel

**`<GlassBoxPanel />`**
- Tabs: Score Breakdown | Learning Timeline | Bias Check
- Score Breakdown: stacked bar (adjacency 40% + velocity 60%)
- Learning Timeline: Recharts LineChart with skill acquisitions as dots, projected Rust mastery as dashed future point
- Bias Check: before/after scores, delta, PASS/FAIL badge

**`<SkillTimelineBuilder />`**
- Candidate-facing
- Add/edit/remove skill entries
- Drag handles for date ranges
- Auto-calculates days_to_learn

**`<VelocityScoreCard />`**
- Hero metric: velocity score out of 100
- Sub-metrics: skills/year, cohort percentile, fastest acquisition

**`<JDParser />`**
- Textarea for JD paste
- "Parse Skills" button → loading state → chip list of extracted skills
- Chips editable (delete wrong ones, add missing)
- Confirm → POST to `/api/jobs/parse`

---

## 10. Scoring Algorithm (Detailed)

### Step 1 — Adjacency Score (0–100)

For each required skill in the JD:
1. Get the candidate's skill embedding vectors from `skill_entries`
2. Query `skills` table via pgvector: `SELECT similarity FROM skill_adjacency WHERE skill_a = required_skill ORDER BY similarity DESC LIMIT 1`
3. If candidate has the exact skill: adjacency = 100
4. Else: adjacency = max cosine similarity × 100

Final adjacency_score = weighted average across all required skills.

### Step 2 — Velocity Score (0–100)

```
raw_velocity = (total skills learned) / (years of history)
cohort_percentile = percentile_rank(raw_velocity, all candidates)
velocity_score = cohort_percentile
```

### Step 3 — Hybrid Score

```
hybrid_score = (adjacency_score × 0.4) + (velocity_score × 0.6)
```

### Step 4 — Time-to-Productivity Estimate

```
avg_days_for_adjacent = mean(days_to_learn for skills with adjacency > 0.7)
adjustment_factor = 1 - (max_adjacency - 0.7) / 0.3  # closer = faster
estimated_days = avg_days_for_adjacent × adjustment_factor
```

Display as "~N weeks" rounded to nearest half-week.

---

## 11. Supabase Edge Functions

### `recalculate-scores` (triggered on skill_entries insert)
```typescript
// Deno edge function
Deno.serve(async (req) => {
  const { candidateId } = await req.json()
  // 1. Fetch all skill_entries for candidate
  // 2. Recalculate velocity_score
  // 3. Update candidates table
  // 4. Trigger rank recalculation for all open job applications
})
```

### `embed-skill` (triggered on skills insert)
Calls OpenAI embeddings API for new skill, stores vector in `skills.embedding`.

---

## 12. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 13. Development Milestones (Hackathon 6h)

| Hour | Milestone |
|---|---|
| 0–1 | Supabase project setup, schema migration, seed 3 synthetic candidates + 1 job |
| 1–2 | `/api/jobs/parse` + `/api/candidates/score` working |
| 2–3 | Hybrid ranking + explanation_chain generation |
| 3–4 | Leaderboard page + GlassBoxPanel component |
| 4–5 | Candidate profile builder + SkillTimelineBuilder |
| 5–6 | Bias check UI + polish + demo script |

---

## 14. Demo Script (Judges)

1. Open `/jobs/new` → paste a Rust developer JD → watch skills auto-parse
2. Show leaderboard: #1 candidate has NO Rust but scores 91/100
3. Expand glass-box: "Knows C++ (87% similar to Rust) · learned TypeScript in 28 days · estimated 2.5 weeks to Rust proficiency"
4. Bias check: score 91 with name → 90 without → delta 1 → ✓ PASS
5. Show candidate #3 who has Rust listed but low velocity → ranked below #1
6. "This is the wow moment: we ranked a non-Rust dev above a Rust dev because they'll be productive faster."