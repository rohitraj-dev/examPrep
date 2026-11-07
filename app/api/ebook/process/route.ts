import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const subjectId = formData.get("subject_id");
    const file = formData.get("file");
    const startingOrderIndex = Number(formData.get("starting_order_index"));

    if (typeof subjectId !== "string" || !subjectId) {
      return NextResponse.json(
        { success: false, error: "Missing subject_id" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing PDF file" },
        { status: 400 },
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size >= MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "PDF file must be smaller than 5 MB" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(startingOrderIndex) || startingOrderIndex < 0) {
      return NextResponse.json(
        { success: false, error: "starting_order_index must be a non-negative integer" },
        { status: 400 },
      );
    }

    const parser = new PDFParse({ data: await file.arrayBuffer() });
    let extractedText: string;
    try {
      const textResult = await parser.getText();
      extractedText = textResult.text;
    } finally {
      await parser.destroy();
    }

    const { error: insertError } = await supabaseAdmin
      .from("ebook_chapters")
      .insert({
        subject_id: subjectId,
        chapter_title: file.name,
        content: extractedText,
        order_index: startingOrderIndex,
      });

    if (insertError) {
      throw new Error(`Failed to insert ebook chapters: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, count: 1 });
  } catch (error) {
    console.error("Ebook processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
