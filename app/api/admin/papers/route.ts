import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const {
      subject_id,
      year,
      exam_type,
      file_url,
      ocr_text,
      ocr_status,
    } = body ?? {};

    if (
      typeof subject_id !== "string" ||
      subject_id.trim().length === 0 ||
      !Number.isInteger(year) ||
      typeof exam_type !== "string" ||
      exam_type.trim().length === 0 ||
      typeof file_url !== "string" ||
      file_url.trim().length === 0 ||
      !isOptionalString(ocr_text) ||
      !isOptionalString(ocr_status)
    ) {
      return NextResponse.json(
        {
          error:
            "subject_id, exam_type, and file_url must be non-empty strings; year must be an integer; ocr_text and ocr_status must be strings or null",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("papers")
      .insert({
        subject_id: subject_id.trim(),
        year,
        exam_type: exam_type.trim(),
        file_url: file_url.trim(),
        ocr_text: ocr_text ?? null,
        ocr_status: ocr_status ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to insert paper" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
