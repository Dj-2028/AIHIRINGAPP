import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const skillsData = [
  { id: "react", name: "React" },
  { id: "typescript", name: "TypeScript" },
  { id: "nodejs", name: "Node.js" },
  { id: "python", name: "Python" },
  { id: "sql", name: "SQL" },
  { id: "java", name: "Java" },
  { id: "csharp", name: "C#" },
  { id: "aws", name: "AWS" },
  { id: "docker", name: "Docker" },
  { id: "kubernetes", name: "Kubernetes" },
  { id: "graphql", name: "GraphQL" }
];

async function seed() {
  console.log("Seeding skills...");
  const { error: skillErr } = await supabase.from('skills').upsert(skillsData);
  if (skillErr) console.error("Error seeding skills:", skillErr);
  else console.log("Skills seeded.");

  console.log("Seeding adjacency matrix...");
  const matrix = [
    { skill_a: "react", skill_b: "typescript", similarity: 0.8 },
    { skill_a: "react", skill_b: "nodejs", similarity: 0.6 },
    { skill_a: "typescript", skill_b: "nodejs", similarity: 0.7 },
    { skill_a: "python", skill_b: "sql", similarity: 0.5 },
    { skill_a: "java", skill_b: "csharp", similarity: 0.8 },
    { skill_a: "aws", skill_b: "docker", similarity: 0.6 },
    { skill_a: "docker", skill_b: "kubernetes", similarity: 0.9 },
    { skill_a: "react", skill_b: "graphql", similarity: 0.7 },
    { skill_a: "nodejs", skill_b: "graphql", similarity: 0.8 }
  ];

  const reverseMatrix = matrix.map(m => ({
    skill_a: m.skill_b,
    skill_b: m.skill_a,
    similarity: m.similarity
  }));

  const fullMatrix = [...matrix, ...reverseMatrix];
  const { error: adjErr } = await supabase.from('skill_adjacency').upsert(fullMatrix, { onConflict: 'skill_a,skill_b' });
  
  if (adjErr) console.error("Error seeding adjacency:", adjErr);
  else console.log("Adjacency seeded.");
}

seed();
