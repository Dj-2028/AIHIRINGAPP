-- ============================================================
-- SkillVelocity — Seed Data (002)
-- Run AFTER 001_schema.sql
-- ============================================================

-- ─── Seed organization ──────────────────────────────────────
insert into organizations (id, name, plan) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', 'pro')
on conflict (id) do nothing;

-- ─── Seed skills ────────────────────────────────────────────
-- NOTE: embeddings will be auto-filled by the embed-skill Edge Function
-- when triggered. For the hackathon, we seed manually without vectors
-- and rely on the manual adjacency table for scoring.
insert into skills (id, name, category) values
  ('rust',          'Rust',                'Systems'),
  ('cpp',           'C++',                 'Systems'),
  ('c',             'C',                   'Systems'),
  ('systems-prog',  'Systems Programming', 'Systems'),
  ('go',            'Go',                  'Systems'),
  ('wasm',          'WebAssembly',         'Systems'),
  ('python',        'Python',              'General'),
  ('typescript',    'TypeScript',          'Web'),
  ('javascript',    'JavaScript',          'Web'),
  ('react',         'React',               'Web'),
  ('nodejs',        'Node.js',             'Web'),
  ('docker',        'Docker',              'DevOps'),
  ('kubernetes',    'Kubernetes',          'DevOps'),
  ('sql',           'SQL',                 'Data'),
  ('ml',            'Machine Learning',    'Data')
on conflict (id) do nothing;

-- ─── Seed skill adjacency (manual for hackathon) ────────────
-- Real production edges are computed by the embed-skill Edge Function
insert into skill_adjacency (skill_a, skill_b, similarity) values
  -- Rust adjacencies
  ('rust', 'cpp',          0.87),
  ('rust', 'c',            0.82),
  ('rust', 'systems-prog', 0.79),
  ('rust', 'go',           0.74),
  ('rust', 'wasm',         0.71),
  -- C++ adjacencies
  ('cpp',  'c',            0.91),
  ('cpp',  'systems-prog', 0.83),
  ('cpp',  'rust',         0.87),
  -- TypeScript adjacencies
  ('typescript', 'javascript', 0.93),
  ('typescript', 'react',      0.78),
  ('typescript', 'nodejs',     0.72),
  -- Python adjacencies
  ('python', 'ml',         0.76),
  ('python', 'go',         0.61),
  -- Go adjacencies
  ('go', 'rust',           0.74),
  ('go', 'docker',         0.65),
  -- DevOps adjacencies
  ('docker',     'kubernetes', 0.82),
  ('kubernetes', 'docker',     0.82),
  -- Web stack
  ('react',   'typescript', 0.78),
  ('react',   'nodejs',     0.69),
  ('nodejs',  'typescript', 0.72),
  ('nodejs',  'javascript', 0.88),
  -- Reverse edges (for bidirectional lookup)
  ('c',            'cpp',          0.91),
  ('c',            'rust',         0.82),
  ('systems-prog', 'rust',         0.79),
  ('systems-prog', 'cpp',          0.83),
  ('wasm',         'rust',         0.71),
  ('go',           'python',       0.61),
  ('javascript',   'typescript',   0.93),
  ('javascript',   'nodejs',       0.88),
  ('ml',           'python',       0.76)
on conflict (skill_a, skill_b) do update set similarity = excluded.similarity;
