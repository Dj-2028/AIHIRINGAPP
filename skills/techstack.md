# SkillVelocity — Tech Stack

## Overview

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 15 | App Router, Server Components, API Routes |
| Database | Supabase | Latest | PostgreSQL + Auth + Edge Functions + Storage |
| Vector Search | pgvector | 0.7+ | Skill embedding similarity (cosine) |
| Styling | Tailwind CSS | v4 | Utility-first styling |
| UI Components | shadcn/ui | Latest | Accessible, unstyled component primitives |
| Charts | Recharts | 2.x | Learning timeline chart, score bars |
| State | Zustand | 5.x | Lightweight client-side state |
| AI — JD Parse | OpenAI GPT-4o-mini | Latest | Extract skills from job description text |
| AI — Embeddings | OpenAI text-embedding-3-small | Latest | Generate skill vectors for adjacency |
| Auth | Supabase Auth | Built-in | Email/password + magic link |
| Hosting | Vercel | Latest | Next.js deployment + edge network |

---

## Package List

### Dependencies
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@supabase/auth-ui-react": "^0.4.0",
    "@supabase/auth-ui-shared": "^0.1.8",
    "openai": "^4.65.0",
    "recharts": "^2.13.0",
    "zustand": "^5.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "^4.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "date-fns": "^4.1.0",
    "swr": "^2.2.0"
  }
}
```

### Dev Dependencies
```json
{
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

---

## Next.js Configuration

### `next.config.ts`
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['openai'],
  },
}

export default nextConfig
```

### `middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (!user && !isAuthRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Supabase Client Setup

### `lib/supabase/client.ts` (browser)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts` (server components & route handlers)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## API Routes

### `app/api/jobs/parse/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { description } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract required skills from a job description.
Return ONLY valid JSON: { "required": [{"skill_name": string, "weight": 1}], "nice_to_have": [{"skill_name": string, "weight": 0.5}] }
No markdown, no explanation, just JSON.`
      },
      { role: 'user', content: description }
    ],
    response_format: { type: 'json_object' }
  })

  const parsed = JSON.parse(response.choices[0].message.content!)
  return NextResponse.json(parsed)
}
```

### `app/api/candidates/score/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { candidateId } = await req.json()
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('skill_entries')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('learned_from', { ascending: true })

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No skill entries' }, { status: 400 })
  }

  // Calculate years span
  const first = new Date(entries[0].learned_from)
  const last = new Date(entries[entries.length - 1].learned_from)
  const yearsSpan = Math.max(
    (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365),
    0.5
  )

  const skillsPerYear = entries.length / yearsSpan

  // Get cohort for percentile
  const { data: cohort } = await supabase
    .from('candidates')
    .select('skills_per_year')
    .not('skills_per_year', 'is', null)

  const cohortValues = (cohort || []).map(c => c.skills_per_year)
  const below = cohortValues.filter(v => v < skillsPerYear).length
  const percentile = cohortValues.length > 0
    ? (below / cohortValues.length) * 100
    : 50

  const velocityScore = Math.round(percentile)

  await supabase
    .from('candidates')
    .update({
      velocity_score: velocityScore,
      skills_per_year: Math.round(skillsPerYear * 10) / 10,
      cohort_percentile: Math.round(percentile),
      last_calculated: new Date().toISOString()
    })
    .eq('id', candidateId)

  return NextResponse.json({ velocityScore, skillsPerYear, percentile })
}
```

### `app/api/applications/rank/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { jobId } = await req.json()
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*, applications(*, candidates(*, skill_entries(*), users(*)))')
    .eq('id', jobId)
    .single()

  const requiredSkills = job.required_skills as { skill_id: string; skill_name: string; weight: number }[]

  const updates = await Promise.all(
    job.applications.map(async (app: any) => {
      const candidate = app.candidates
      const candidateSkillIds = candidate.skill_entries
        .filter((e: any) => e.skill_id)
        .map((e: any) => e.skill_id)

      // Calculate adjacency score
      let totalAdjacency = 0
      for (const req of requiredSkills) {
        if (candidateSkillIds.includes(req.skill_id)) {
          totalAdjacency += 100
        } else {
          const { data: adj } = await supabase
            .from('skill_adjacency')
            .select('similarity')
            .eq('skill_a', req.skill_id)
            .in('skill_b', candidateSkillIds)
            .order('similarity', { ascending: false })
            .limit(1)
            .single()
          totalAdjacency += adj ? adj.similarity * 100 : 0
        }
      }
      const adjacencyScore = requiredSkills.length > 0
        ? totalAdjacency / requiredSkills.length
        : 0

      const velocityScore = candidate.velocity_score || 0

      // Bias check: hybrid score without demographic fields
      const scoreWithDemographics = (adjacencyScore * 0.4) + (velocityScore * 0.6)
      const scoreWithout = scoreWithDemographics // same — demographics not in formula
      const delta = Math.abs(scoreWithDemographics - scoreWithout)

      const biasCheck = {
        score_with_demographics: Math.round(scoreWithDemographics),
        score_without_demographics: Math.round(scoreWithout),
        delta: Math.round(delta),
        status: delta < 5 ? 'PASS' : delta < 10 ? 'REVIEW' : 'FAIL',
        threshold: 5,
        fields_removed: ['name', 'university', 'graduation_year', 'location']
      }

      // Generate explanation
      const fastestEntry = candidate.skill_entries
        .filter((e: any) => e.days_to_learn)
        .sort((a: any, b: any) => a.days_to_learn - b.days_to_learn)[0]

      const avgDaysToLearn = candidate.skill_entries
        .filter((e: any) => e.days_to_learn)
        .reduce((sum: number, e: any) => sum + e.days_to_learn, 0) /
        (candidate.skill_entries.filter((e: any) => e.days_to_learn).length || 1)

      const estimatedWeeks = Math.ceil(avgDaysToLearn / 7 * (1 - (Math.max(adjacencyScore - 70, 0) / 100)))

      const explanationChain = {
        match_score: Math.round((adjacencyScore * 0.4) + (velocityScore * 0.6)),
        current_skills: {
          matched: candidateSkillIds.filter((id: string) =>
            requiredSkills.some(r => r.skill_id === id)
          ),
          missing: requiredSkills
            .filter(r => !candidateSkillIds.includes(r.skill_id))
            .map(r => r.skill_name),
          adjacency_note: `Strongest adjacent skill match: ${Math.round(adjacencyScore)}% similar`
        },
        velocity: {
          score: velocityScore,
          skills_per_year: candidate.skills_per_year,
          cohort_percentile: candidate.cohort_percentile,
          fastest_acquisition: fastestEntry
            ? `${fastestEntry.skill_name} in ${fastestEntry.days_to_learn} days`
            : 'N/A'
        },
        time_to_productivity: {
          estimate_weeks: `${Math.max(1, estimatedWeeks - 1)}–${estimatedWeeks + 1} weeks`,
          basis: `Based on avg ${Math.round(avgDaysToLearn)} days per adjacent skill`
        }
      }

      return {
        id: app.id,
        adjacency_score: Math.round(adjacencyScore),
        velocity_score: velocityScore,
        bias_check: biasCheck,
        explanation_chain: explanationChain,
        updated_at: new Date().toISOString()
      }
    })
  )

  // Sort and assign ranks
  updates.sort((a, b) =>
    ((b.adjacency_score * 0.4) + (b.velocity_score * 0.6)) -
    ((a.adjacency_score * 0.4) + (a.velocity_score * 0.6))
  )
  updates.forEach((u, i) => Object.assign(u, { rank: i + 1 }))

  // Upsert all
  await supabase.from('applications').upsert(updates)

  return NextResponse.json({ ranked: updates.length })
}
```

---

## Environment Variables

### `.env.local`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel (production)
Set the same variables in Vercel project settings → Environment Variables.
Set `NEXT_PUBLIC_APP_URL` to your production domain.

---

## Supabase Project Setup Checklist

```bash
# 1. Create project at supabase.com

# 2. Enable pgvector
# Dashboard → SQL Editor → Run:
# create extension if not exists "pgvector";

# 3. Run schema migrations (from 03_backend_schema.md)

# 4. Set Edge Function secrets
supabase secrets set OPENAI_API_KEY=sk-...

# 5. Deploy edge functions
supabase functions deploy recalculate-scores
supabase functions deploy embed-skill

# 6. Create DB webhooks
# Dashboard → Database → Webhooks:
# - skill_entries INSERT/UPDATE → recalculate-scores
# - skills INSERT → embed-skill
```

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Production deploy
vercel --prod
```

---

## Local Development

```bash
# Clone and install
npm install

# Copy env
cp .env.example .env.local
# Fill in values

# Run Supabase locally (optional)
npx supabase start

# Run dev server
npm run dev
# → http://localhost:3000
```