# SkillVelocity — Task Checklist

## Phase 1 — Dependencies & Project Config
- [x] Install all required npm packages (supabase, gemini, recharts, zustand, radix-ui, lucide-react, date-fns, swr, clsx, tailwind-merge, class-variance-authority)
- [x] Update [next.config.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/next.config.ts) with serverExternalPackages
- [x] Create [.env.local](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/.env.local) template
- [x] Set up [middleware.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/middleware.ts) for auth guard

## Phase 2 — Supabase & Database
- [x] Create [lib/supabase/client.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/supabase/client.ts) (browser client)
- [x] Create [lib/supabase/server.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/supabase/server.ts) (server client)
- [x] Write full SQL migration file (all tables + RLS policies + trigger)
- [x] Write seed SQL file (skills + adjacency + org)
- [x] Write Supabase Edge Functions (`recalculate-scores`, `embed-skill`)

## Phase 3 — TypeScript Types & Core Logic
- [x] Create [types/index.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/types/index.ts) with all shared types
- [x] Create [lib/scoring/velocity.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/scoring/velocity.ts)
- [x] Create [lib/scoring/adjacency.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/scoring/adjacency.ts)
- [x] Create [lib/scoring/hybrid.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/scoring/hybrid.ts)
- [x] Create [lib/scoring/timeToProductivity.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/scoring/timeToProductivity.ts)
- [x] Create [lib/gemini/parseJD.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/gemini/parseJD.ts)
- [x] Create [lib/gemini/generateExplanation.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/lib/gemini/generateExplanation.ts)

## Phase 4 — API Routes
- [x] [app/api/jobs/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/jobs/route.ts) — POST create job
- [x] [app/api/jobs/parse/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/jobs/parse/route.ts) — POST parse JD (Gemini)
- [x] `app/api/jobs/[jobId]/leaderboard/route.ts` — GET ranked applications
- [x] [app/api/candidates/score/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/candidates/score/route.ts) — POST score candidate
- [x] [app/api/applications/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/applications/route.ts) — POST create application
- [x] [app/api/applications/rank/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/applications/rank/route.ts) — POST rank job applications
- [x] `app/api/applications/[id]/route.ts` — PATCH status update
- [x] [app/api/skills/adjacency/route.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/api/skills/adjacency/route.ts) — PATCH similarity update

## Phase 5 — Shared Components
- [x] [components/shared/BiasCheckBadge.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/shared/BiasCheckBadge.tsx)
- [x] [components/shared/ScorePill.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/shared/ScorePill.tsx)
- [x] [components/shared/RoleBadge.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/shared/RoleBadge.tsx)
- [x] [components/shared/LoadingSpinner.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/shared/LoadingSpinner.tsx)

## Phase 6 — Leaderboard Components
- [x] [components/leaderboard/ScoreBreakdownBar.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/ScoreBreakdownBar.tsx)
- [x] [components/leaderboard/BiasCheckPanel.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/BiasCheckPanel.tsx)
- [x] [components/leaderboard/LearningTimelineChart.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/LearningTimelineChart.tsx)
- [x] [components/leaderboard/GlassBoxPanel.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/GlassBoxPanel.tsx)
- [x] [components/leaderboard/CandidateRow.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/CandidateRow.tsx)
- [x] [components/leaderboard/LeaderboardTable.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/leaderboard/LeaderboardTable.tsx)

## Phase 7 — Candidate Components
- [x] [components/candidate/SkillEntryForm.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/candidate/SkillEntryForm.tsx)
- [x] [components/candidate/SkillTimelineBuilder.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/candidate/SkillTimelineBuilder.tsx)
- [x] [components/candidate/VelocityScoreCard.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/candidate/VelocityScoreCard.tsx)

## Phase 8 — Job Components
- [x] [components/jobs/SkillChip.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/jobs/SkillChip.tsx)
- [x] [components/jobs/SkillChipList.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/jobs/SkillChipList.tsx)
- [x] [components/jobs/JDParser.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/components/jobs/JDParser.tsx)

## Phase 9 — Zustand Store
- [x] [store/useAppStore.ts](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/store/useAppStore.ts)

## Phase 10 — Pages (App Router)
- [ ] Auth group: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- [ ] App layout: `app/(app)/layout.tsx` (auth guard + role check)
- [ ] `app/(app)/dashboard/page.tsx` (role-aware)
- [ ] `app/(app)/jobs/new/page.tsx`
- [ ] `app/(app)/jobs/[jobId]/page.tsx` (leaderboard)
- [ ] `app/(app)/jobs/[jobId]/apply/page.tsx`
- [ ] `app/(app)/profile/page.tsx`
- [ ] `app/(app)/profile/setup/page.tsx`
- [ ] `app/(app)/admin/org/page.tsx`
- [ ] `app/(app)/admin/skill-graph/page.tsx`
- [ ] `app/(app)/admin/bias-log/page.tsx`
- [ ] `app/(app)/admin/analytics/page.tsx`
- [ ] Landing page update: [app/page.tsx](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/page.tsx)
- [ ] Global styles update: [app/globals.css](file:///c:/Users/Diksha%20Jain/Desktop/AIhiring/my-app/app/globals.css)

## Phase 11 — Verification
- [ ] Verify dev server starts (`npm run dev`)
- [ ] Verify TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Manual browser walkthrough of recruiter flow
- [ ] Manual browser walkthrough of candidate flow
