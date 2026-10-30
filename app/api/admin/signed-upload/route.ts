import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const path = body?.path;

    if (typeof path !== "string" || path.trim().length === 0) {
      return NextResponse.json(
        { error: "path must be a non-empty string" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from("papers")
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create signed upload URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ path, token: data.token });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
