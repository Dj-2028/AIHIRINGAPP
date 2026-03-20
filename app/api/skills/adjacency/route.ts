import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { skill_a, skill_b, similarity } = await req.json();
    if (!skill_a || !skill_b || similarity == null) {
      return NextResponse.json({ error: "skill_a, skill_b, similarity required" }, { status: 400 });
    }
    if (similarity < 0 || similarity > 1) {
      return NextResponse.json({ error: "similarity must be 0–1" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("skill_adjacency")
      .upsert({ skill_a, skill_b, similarity, updated_at: new Date().toISOString() }, { onConflict: "skill_a,skill_b" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("skill_adjacency")
      .select("*, skills!skill_adjacency_skill_a_fkey(name), skills!skill_adjacency_skill_b_fkey(name)")
      .order("similarity", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
