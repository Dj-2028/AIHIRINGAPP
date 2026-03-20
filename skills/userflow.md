# SkillVelocity — User Flow

## Roles
- `recruiter` — posts jobs, views leaderboard, shortlists candidates
- `candidate` — builds profile, adds learning timeline, applies to jobs
- `admin` — manages org, edits skill graph, reviews bias audit log

---

## Flow 1 — Recruiter

```
/auth/login
  → /dashboard (recruiter view)
  → /jobs/new
      → Paste job description into textarea
      → Click "Parse Skills" → POST /api/jobs/parse
      → Review extracted skill chips (delete/add)
      → Click "Post Job" → job created in DB
  → /jobs/[jobId]
      → Leaderboard table renders (sorted by hybrid_score DESC)
      → Each row: rank | candidate name | hybrid score | velocity score | adjacency score | time-to-productivity | bias badge
      → Click row → inline GlassBoxPanel expands
          → Tab 1: Score Breakdown (stacked bar: adjacency 40% + velocity 60%)
          → Tab 2: Learning Timeline (line chart, projected mastery as dashed future point)
          → Tab 3: Bias Check (score with vs without demographics, delta, PASS/FAIL)
      → Click "Shortlist" → application.status = 'shortlisted'
      → Click "Invite to Interview" → application.status = 'interview'
```

---

## Flow 2 — Candidate

```
/auth/signup
  → Select role: "Candidate"
  → /profile/setup
      → Enter full name, headline, location (optional)
      → Add skills via SkillTimelineBuilder:
          → Add entry: skill name | learned_from (date) | learned_to (date)
          → System calculates days_to_learn automatically
          → Repeat for all skills in history
      → Click "Save Profile" → POST /api/candidates/score triggered
          → velocity_score, skills_per_year, cohort_percentile calculated and stored
  → /jobs
      → Browse open jobs list
      → Click job → /jobs/[jobId]/apply
          → See own predicted score before applying
          → Click "Apply" → application created
  → /profile
      → See VelocityScoreCard (score, percentile, fastest acquisition)
      → See own rank on any applied job (if recruiter has run ranking)
```

---

## Flow 3 — Admin

```
/auth/login (admin role)
  → /dashboard (admin view)
  → /admin/org
      → Manage users, assign roles, invite team members
  → /admin/skill-graph
      → Visual node graph of skill adjacencies
      → Edit similarity scores between skills
      → Add new skills → triggers embed-skill edge function
  → /admin/bias-log
      → Table of all bias checks across all jobs
      → Filter by job, date, delta threshold
      → Export as CSV
  → /admin/analytics
      → Funnel: applications → shortlisted → interviewed → hired
      → Avg velocity score by job category
      → % of #1 ranked candidates who were non-exact matches
```

---

## Shared Auth Flow

```
/auth/login
  → Supabase Auth UI (email/password or magic link)
  → On success: read users.role from DB
  → Redirect:
      recruiter → /dashboard (recruiter view)
      candidate → /profile (if incomplete) OR /jobs
      admin     → /admin/org
```

---

## Page → API Route Map

| Page | API call | Notes |
|---|---|---|
| `/jobs/new` | `POST /api/jobs/parse` | JD → skill chips |
| `/jobs/new` submit | `POST /api/jobs` | Creates job row |
| `/jobs/[jobId]` load | `GET /api/jobs/[jobId]/leaderboard` | Ranked applications |
| `/jobs/[jobId]` shortlist | `PATCH /api/applications/[id]` | status update |
| `/profile/setup` save | `POST /api/candidates/score` | Recalculate velocity |
| `/jobs/[jobId]/apply` | `POST /api/applications` | Create application + score |
| `/admin/skill-graph` edit | `PATCH /api/skills/adjacency` | Update similarity |

---

## State Transitions — Application Status

```
applied → shortlisted → interview → offered → hired
                      ↘ rejected
```