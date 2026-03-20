import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership via candidate → user relationship
    const { data: entry } = await supabase
      .from("skill_entries")
      .select("id, candidates(user_id)")
      .eq("id", id)
      .maybeSingle();

    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { error } = await supabase
      .from("skill_entries")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
