import { NextResponse } from "next/server";
import { Agent, setGlobalDispatcher } from "undici";
import { GEMINI_MODEL } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

setGlobalDispatcher(new Agent({ headersTimeout: 600000, bodyTimeout: 600000 }));

type GeminiChapter = {
  chapter_title: string;
  content: string;
};

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const pdfBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(pdfBuffer).toString("base64");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const prompt = `Extract the complete book from this PDF as a JSON array of chapters. Each chapter must have exactly two string fields: "chapter_title" and "content". "content" must contain the full text of that chapter, preserving the original wording and paragraphs as much as possible. Include every chapter in the book and do not summarize, omit, or combine chapters. Return ONLY valid JSON with no markdown, code fences, or explanation.`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error ${geminiResponse.status}: ${errorText}`,
        },
        { status: geminiResponse.status },
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    let chapters: GeminiChapter[];
    try {
      chapters = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { success: false, error: "Gemini returned invalid JSON", raw: responseText },
        { status: 422 },
      );
    }

    if (
      !Array.isArray(chapters) ||
      chapters.length === 0 ||
      chapters.some(
        (chapter) =>
          !chapter ||
          typeof chapter.chapter_title !== "string" ||
          !chapter.chapter_title.trim() ||
          typeof chapter.content !== "string" ||
          !chapter.content.trim(),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini response must be a non-empty array of chapters with chapter_title and content strings",
        },
        { status: 422 },
      );
    }

    const rows = chapters.map((chapter, index) => ({
      subject_id: subjectId,
      chapter_title: chapter.chapter_title.trim(),
      content: chapter.content,
      order_index: startingOrderIndex + index,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("ebook_chapters")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert ebook chapters: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, count: rows.length });
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
