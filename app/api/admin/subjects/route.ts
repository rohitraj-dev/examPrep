import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { name, code, semester, branch } = body ?? {};

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      !isOptionalString(code) ||
      !isOptionalString(semester) ||
      !isOptionalString(branch)
    ) {
      return NextResponse.json(
        { error: "name must be non-empty; code, semester, and branch must be strings or null" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("subjects")
      .insert({
        name: name.trim(),
        code: code ?? null,
        semester: semester ?? null,
        branch: branch ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to insert subject" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
