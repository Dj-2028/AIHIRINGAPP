# SkillVelocity — Frontend Specification

## Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui
- **Charts:** Recharts
- **State:** Zustand (client-side only)
- **Auth:** Supabase Auth UI (`@supabase/auth-ui-react`)
- **Data fetching:** Server Components for initial load, SWR for client mutations

---

## Folder Structure

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  (app)/
    layout.tsx              ← auth guard + role check
    dashboard/page.tsx
    jobs/
      new/page.tsx
      [jobId]/
        page.tsx            ← leaderboard
        apply/page.tsx
    profile/
      page.tsx
      setup/page.tsx
    admin/
      org/page.tsx
      skill-graph/page.tsx
      bias-log/page.tsx
      analytics/page.tsx
  api/
    jobs/
      route.ts              ← POST create job
      parse/route.ts        ← POST parse JD
      [jobId]/
        leaderboard/route.ts
    candidates/
      score/route.ts
    applications/
      route.ts
      [id]/route.ts
    skills/
      adjacency/route.ts

components/
  leaderboard/
    LeaderboardTable.tsx
    CandidateRow.tsx
    GlassBoxPanel.tsx
    ScoreBreakdownBar.tsx
    LearningTimelineChart.tsx
    BiasCheckPanel.tsx
  candidate/
    SkillTimelineBuilder.tsx
    VelocityScoreCard.tsx
    SkillEntryForm.tsx
  jobs/
    JDParser.tsx
    SkillChip.tsx
    SkillChipList.tsx
  shared/
    BiasCheckBadge.tsx
    ScorePill.tsx
    RoleBadge.tsx
    LoadingSpinner.tsx

lib/
  supabase/
    client.ts               ← browser client
    server.ts               ← server client (cookies)
  scoring/
    velocity.ts             ← velocity calculation logic
    adjacency.ts            ← adjacency score logic
    hybrid.ts               ← hybrid score formula
    timeToProductivity.ts   ← TTP estimate
  openai/
    parseJD.ts              ← GPT-4o-mini JD extraction
    generateExplanation.ts  ← explanation chain generation

types/
  index.ts                  ← all shared TypeScript types
```

---

## Pages

### `/dashboard`
Role-aware landing after login.

**Recruiter view:**
- Stat cards: Open Jobs | Total Applications | Avg Velocity Score | Bias Checks Passed
- Table: recent jobs with application count and top candidate score
- CTA: "Post New Job"

**Candidate view:**
- VelocityScoreCard (hero)
- Applied jobs list with own rank in each
- CTA: "Browse Jobs" / "Update Profile"

---

### `/jobs/new`

1. `<JDParser />` — textarea for paste, "Parse Skills" button
2. On parse success: `<SkillChipList />` renders extracted skills as removable chips
3. Add-skill input for manual additions
4. Job title + seniority level fields
5. "Post Job" submit → creates job, redirects to `/jobs/[jobId]`

---

### `/jobs/[jobId]` — Leaderboard

Server component: fetches ranked applications on load.

Layout: full-width table with sticky header.

**`<LeaderboardTable />`** columns:
| # | Candidate | Hybrid Score | Velocity | Adjacency | Time to Productive | Bias |
|---|---|---|---|---|---|---|

- Default sort: hybrid_score DESC
- Click column header to re-sort
- Click row → expands `<GlassBoxPanel />` inline (accordion, not modal)
- "Shortlist" button per row → PATCH status

**`<GlassBoxPanel />`** — 3 tabs:

**Tab 1: Score Breakdown**
- Two-segment horizontal bar: Adjacency (40%) in blue, Velocity (60%) in amber
- Below bar: bullet points from `explanation_chain.current_skills` and `explanation_chain.velocity`
- Time-to-productivity estimate in a highlighted callout box

**Tab 2: Learning Timeline**
- Recharts `<LineChart>` — x axis: dates, y axis: cumulative skills
- Each skill acquisition = dot with tooltip (skill name, days taken)
- Projected future mastery of target skill = dashed line segment ending at a star marker

**Tab 3: Bias Check**
- Two score pills side by side: "With demographics: 84" | "Without: 83"
- Delta: Δ1 point
- Large badge: ✓ PASS (green) or ⚠ REVIEW (amber, delta ≥ 5)
- List of fields removed for shadow calc: Name, University, Graduation Year, Location

---

### `/profile/setup` & `/profile`

**`<SkillTimelineBuilder />`**
- List of skill entries, each showing: skill name | date range | days to learn
- "+ Add Skill" opens `<SkillEntryForm />`
- SkillEntryForm fields: skill name (autocomplete from skills table) | from date | to date
- On save: POST to skill_entries, triggers score recalculation

**`<VelocityScoreCard />`**
- Large number: velocity score /100
- Sub-stats: Skills/year | Cohort percentile | Fastest acquisition
- Mini sparkline bar showing skill acquisition over time

---

### `/admin/skill-graph`

- Force-directed graph (use `react-force-graph-2d` or D3)
- Nodes = skills, edges = adjacency (thickness = similarity score)
- Click node → panel shows: skill name, category, top 5 adjacent skills with scores
- Edit mode: click edge → input to update similarity value → PATCH `/api/skills/adjacency`

---

### `/admin/bias-log`

- Filterable table: job title | candidate | score_with | score_without | delta | status | date
- Filter by: date range, job, status (PASS/REVIEW/FAIL)
- "Export CSV" button

---

## Key Component Specs

### `<BiasCheckBadge />`
```tsx
// Props
{ status: 'PASS' | 'REVIEW' | 'FAIL', delta: number }

// Renders
// PASS  → green pill "✓ Bias check passed  Δ{delta}"
// REVIEW → amber pill "⚠ Review  Δ{delta}"
// FAIL  → red pill "✗ Flag  Δ{delta}"
```

### `<ScorePill />`
```tsx
// Props
{ score: number, label: string, color: 'blue' | 'amber' | 'green' | 'gray' }

// Renders: rounded pill with score/100 and label below
```

### `<SkillChip />`
```tsx
// Props
{ name: string, removable?: boolean, onRemove?: () => void }

// Renders: pill with skill name + × if removable
```

### `<VelocityScoreCard />`
```tsx
// Props
{ score: number, skillsPerYear: number, percentile: number, fastestSkill: string, fastestDays: number }
```

---

## TypeScript Types

```typescript
// types/index.ts

export type Role = 'recruiter' | 'candidate' | 'admin'

export type SkillRef = {
  skill_id: string
  skill_name: string
  weight: number  // 1 = required, 0.5 = nice-to-have
}

export type SkillEntry = {
  id: string
  candidate_id: string
  skill_name: string
  skill_id?: string
  learned_from: string  // ISO date
  learned_to?: string
  days_to_learn?: number
  source: 'self-reported' | 'github' | 'coursera'
}

export type ApplicationScore = {
  adjacency_score: number
  velocity_score: number
  hybrid_score: number
  rank: number
  status: ApplicationStatus
  bias_check: BiasCheck
  explanation_chain: ExplanationChain
}

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'hired'
  | 'rejected'

export type BiasCheck = {
  score_with_demographics: number
  score_without_demographics: number
  delta: number
  status: 'PASS' | 'REVIEW' | 'FAIL'
  threshold: number
  fields_removed: string[]
}

export type ExplanationChain = {
  match_score: number
  current_skills: {
    matched: string[]
    missing: string[]
    adjacency_note: string
  }
  velocity: {
    score: number
    skills_per_year: number
    cohort_percentile: number
    fastest_acquisition: string
  }
  time_to_productivity: {
    estimate_weeks: string
    basis: string
  }
}

export type CandidateWithScore = {
  id: string
  user_id: string
  full_name: string
  velocity_score: number
  skills_per_year: number
  cohort_percentile: number
  skill_entries: SkillEntry[]
}

export type JobWithApplications = {
  id: string
  title: string
  required_skills: SkillRef[]
  applications: (ApplicationScore & { candidate: CandidateWithScore })[]
}
```

---

## Zustand Store

```typescript
// store/useAppStore.ts

interface AppStore {
  // Job creation
  parsedSkills: SkillRef[]
  setParsedSkills: (skills: SkillRef[]) => void
  removeSkill: (skill_id: string) => void

  // Leaderboard
  expandedCandidateId: string | null
  setExpandedCandidate: (id: string | null) => void
  activeGlassBoxTab: 'breakdown' | 'timeline' | 'bias'
  setActiveGlassBoxTab: (tab: AppStore['activeGlassBoxTab']) => void

  // Profile builder
  skillEntries: SkillEntry[]
  addSkillEntry: (entry: Omit<SkillEntry, 'id'>) => void
  removeSkillEntry: (id: string) => void
}
```

---

## Environment Variables (Frontend)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```