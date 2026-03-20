import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get candidate record for this user
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!candidate) {
      return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
    }

    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    // Check job exists and is open
    const { data: job } = await supabase
      .from("jobs")
      .select("id, status")
      .eq("id", jobId)
      .single();

    if (!job || job.status !== "open") {
      return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
    }

    // Create application (ignore duplicate conflict)
    const { data: application, error } = await supabase
      .from("applications")
      .insert({ candidate_id: candidate.id, job_id: jobId, status: "applied" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already applied" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(application, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
