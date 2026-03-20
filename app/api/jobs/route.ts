import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
      .from("users")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "recruiter" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, required_skills, nice_to_have, seniority } = body;

    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        org_id: userData.org_id,
        posted_by: user.id,
        title,
        description: description ?? null,
        required_skills: required_skills ?? [],
        nice_to_have: nice_to_have ?? [],
        seniority: seniority ?? null,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
      .from("users")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });

    if (userData?.role === "candidate") {
      query = supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
    } else if (userData?.org_id) {
      query = supabase.from("jobs").select("*").eq("org_id", userData.org_id).order("created_at", { ascending: false });
    }

    const { data: jobs, error } = await query;
    if (error) throw error;
    return NextResponse.json(jobs);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
