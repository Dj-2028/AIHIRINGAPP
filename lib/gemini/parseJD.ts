import type { SkillRef } from "@/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function parseJobDescription(description: string): Promise<{
  required: SkillRef[];
  nice_to_have: SkillRef[];
}> {
  const prompt = `You are a technical recruiter assistant. Extract skills from the job description below.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "required": [{"skill_id": "slug-lowercase", "skill_name": "Display Name", "weight": 1}],
  "nice_to_have": [{"skill_id": "slug-lowercase", "skill_name": "Display Name", "weight": 0.5}]
}

Rules:
- skill_id must be lowercase, hyphen-separated (e.g. "machine-learning", "node-js")
- Only include technical skills (languages, frameworks, tools, platforms)
- required = explicitly required in the JD
- nice_to_have = "nice to have", "preferred", "bonus", or "plus"

Job Description:
${description}`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      required: Array.isArray(parsed.required) ? parsed.required : [],
      nice_to_have: Array.isArray(parsed.nice_to_have)
        ? parsed.nice_to_have
        : [],
    };
  } catch {
    return { required: [], nice_to_have: [] };
  }
}
