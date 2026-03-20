import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { candidate_id, skill_name, skill_id, learned_from, learned_to, source } = body;

    if (!candidate_id || !skill_name || !learned_from) {
      return NextResponse.json({ error: "candidate_id, skill_name, learned_from are required" }, { status: 400 });
    }

    // Verify user owns this candidate profile
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("id", candidate_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found or forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("skill_entries")
      .insert({
        candidate_id,
        skill_name,
        skill_id: skill_id ?? null,
        learned_from,
        learned_to: learned_to ?? null,
        source: source ?? "self-reported",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");

    let query = supabase
      .from("skill_entries")
      .select("*")
      .order("learned_from", { ascending: true });

    if (candidateId) {
      query = supabase
        .from("skill_entries")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("learned_from", { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
