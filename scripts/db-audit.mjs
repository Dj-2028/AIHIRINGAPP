import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

const env = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}=(.+)`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log("Running Database Audit...");
  
  const queries = [
    { name: 'skills', query: supabase.from('skills').select('*', { count: 'exact', head: true }) },
    { name: 'skill_adjacency', query: supabase.from('skill_adjacency').select('*', { count: 'exact', head: true }) },
    { name: 'users', query: supabase.from('users').select('*', { count: 'exact', head: true }) },
    { name: 'organizations', query: supabase.from('organizations').select('*', { count: 'exact', head: true }) },
    { name: 'candidates', query: supabase.from('candidates').select('*', { count: 'exact', head: true }) },
    { name: 'skill_entries', query: supabase.from('skill_entries').select('*', { count: 'exact', head: true }) },
    { name: 'applications', query: supabase.from('applications').select('*', { count: 'exact', head: true }) },
  ];

  for (const q of queries) {
    const { count, error } = await q.query;
    if (error) {
      console.error(`Error querying ${q.name}:`, error.message);
    } else {
      console.log(`Table ${q.name} row count: ${count}`);
    }
  }

  // Check generated columns on skill_entries
  const { data: entries, error: entriesError } = await supabase.from('skill_entries').select('id, learned_from, learned_to, days_to_learn').limit(3);
  if (entriesError) console.error("Error fetching skill_entries columns:", entriesError.message);
  else console.log("Sample skill_entries:", entries);
  
  const { data: apps, error: appsError } = await supabase.from('applications').select('id, adjacency_score, velocity_score, hybrid_score').limit(3);
  if (appsError) console.error("Error fetching applications columns:", appsError.message);
  else console.log("Sample applications:", apps);

}

runAudit();
