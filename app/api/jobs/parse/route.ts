import { NextRequest, NextResponse } from "next/server";
import { parseJobDescription } from "@/lib/gemini/parseJD";

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Description too short" }, { status: 400 });
    }

    const result = await parseJobDescription(description);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
