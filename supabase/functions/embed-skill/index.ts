// supabase/functions/embed-skill/index.ts
// Triggered via DB webhook after skills INSERT
// Calls Gemini text-embedding-004, stores the vector, then upserts adjacency rows

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SkillRow {
  id: string;
  name: string;
  embedding: number[] | null;
}

interface AdjacencyRow {
  skill_a: string;
  skill_b: string;
  similarity: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getGeminiEmbedding(skillName: string, apiKey: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: skillName }] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini embedding error: ${err}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

Deno.serve(async (req: Request) => {
  try {
    const { skillId, skillName } = await req.json();

    if (!skillId || !skillName) {
      return new Response(
        JSON.stringify({ error: "skillId and skillName are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get embedding for this skill
    const embedding = await getGeminiEmbedding(skillName, geminiKey);

    // 2. Store embedding on the skill row
    await supabase
      .from("skills")
      .update({ embedding })
      .eq("id", skillId);

    // 3. Fetch all other skills that already have embeddings
    const { data: allSkills } = await supabase
      .from("skills")
      .select("id, name, embedding")
      .neq("id", skillId)
      .not("embedding", "is", null);

    // 4. Compute adjacency and upsert pairs where similarity >= 0.6
    const adjacencyRows: AdjacencyRow[] = ((allSkills as SkillRow[]) || [])
      .filter((s) => s.embedding !== null)
      .flatMap((s) => {
        const sim = cosineSimilarity(embedding, s.embedding as number[]);
        if (sim < 0.6) return [];
        return [
          { skill_a: skillId, skill_b: s.id, similarity: sim },
          { skill_a: s.id, skill_b: skillId, similarity: sim },
        ];
      });

    if (adjacencyRows.length > 0) {
      await supabase
        .from("skill_adjacency")
        .upsert(adjacencyRows, { onConflict: "skill_a,skill_b" });
    }

    return new Response(
      JSON.stringify({ embedded: true, adjacencyPairs: adjacencyRows.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
