// ============================================================
// SkillVelocity — Shared TypeScript Types
// ============================================================

export type Role = "recruiter" | "candidate" | "admin";

export type SkillRef = {
  skill_id: string;
  skill_name: string;
  weight: number; // 1 = required, 0.5 = nice-to-have
};

export type SkillEntry = {
  id: string;
  candidate_id: string;
  skill_name: string;
  skill_id?: string | null;
  learned_from: string; // ISO date
  learned_to?: string | null;
  days_to_learn?: number | null;
  source: "self-reported" | "github" | "coursera" | "linkedin";
  created_at?: string;
};

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected";

export type BiasCheck = {
  score_with_demographics: number;
  score_without_demographics: number;
  delta: number;
  status: "PASS" | "REVIEW" | "FAIL";
  threshold: number;
  fields_removed: string[];
};

export type ExplanationChain = {
  match_score: number;
  current_skills: {
    matched: string[];
    missing: string[];
    adjacency_note: string;
  };
  velocity: {
    score: number;
    skills_per_year: number | null;
    cohort_percentile: number | null;
    fastest_acquisition: string;
  };
  time_to_productivity: {
    estimate_weeks: string;
    basis: string;
  };
};

export type ApplicationScore = {
  id: string;
  candidate_id: string;
  job_id: string;
  adjacency_score: number | null;
  velocity_score: number | null;
  hybrid_score: number | null;
  rank: number | null;
  status: ApplicationStatus;
  bias_check: BiasCheck | null;
  explanation_chain: ExplanationChain | null;
  created_at?: string;
  updated_at?: string;
};

export type CandidateProfile = {
  id: string;
  user_id: string;
  velocity_score: number | null;
  skills_per_year: number | null;
  cohort_percentile: number | null;
  last_calculated: string | null;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  role: Role;
  org_id: string | null;
  created_at?: string;
};

export type CandidateWithScore = CandidateProfile & {
  users: UserProfile;
  skill_entries: SkillEntry[];
};

export type Job = {
  id: string;
  org_id: string;
  posted_by: string;
  title: string;
  description: string | null;
  required_skills: SkillRef[];
  nice_to_have: SkillRef[];
  seniority: "junior" | "mid" | "senior" | "lead" | "any" | null;
  status: "draft" | "open" | "closed";
  created_at?: string;
  updated_at?: string;
};

export type JobWithApplications = Job & {
  applications: (ApplicationScore & { candidates: CandidateWithScore })[];
};

export type Organization = {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  created_at?: string;
};

export type Skill = {
  id: string;
  name: string;
  category: string | null;
  created_at?: string;
};

export type SkillAdjacency = {
  id: string;
  skill_a: string;
  skill_b: string;
  similarity: number;
};

// API response shapes
export type ParseJDResponse = {
  required: SkillRef[];
  nice_to_have: SkillRef[];
};

export type ScoreResponse = {
  velocityScore: number;
  skillsPerYear: number;
  percentile: number;
};

export type LeaderboardEntry = ApplicationScore & {
  candidates: CandidateWithScore;
};
