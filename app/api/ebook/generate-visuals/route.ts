import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

type VisualType = "flowchart" | "table" | "comparison";

type GeneratedVisual = {
  type: VisualType;
  title: string;
  content: {
    steps?: string[];
    headers?: string[];
    rows?: string[][];
  };
};

function parseVisuals(responseText: string): GeneratedVisual[] {
  const stripped = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const parsed: unknown = JSON.parse(stripped);

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini did not return an array");
  }

  const visuals = parsed.filter((item): item is GeneratedVisual => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as Record<string, unknown>;
    if (
      !["flowchart", "table", "comparison"].includes(
        candidate.type as string,
      ) ||
      typeof candidate.title !== "string" ||
      !candidate.title.trim() ||
      !candidate.content ||
      typeof candidate.content !== "object"
    ) {
      return false;
    }

    const content = candidate.content as Record<string, unknown>;

    if (candidate.type === "flowchart") {
      return (
        Array.isArray(content.steps) &&
        content.steps.length > 0 &&
        content.steps.every(
          (step): step is string =>
            typeof step === "string" && step.trim().length > 0,
        )
      );
    }

    const headers = content.headers;
    const rows = content.rows;

    return (
      Array.isArray(headers) &&
      headers.length > 0 &&
      headers.every(
        (header): header is string =>
          typeof header === "string" && header.trim().length > 0,
      ) &&
      Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(
        (row): row is string[] =>
          Array.isArray(row) &&
          row.length === headers.length &&
          row.every(
            (cell): cell is string =>
              typeof cell === "string" && cell.trim().length > 0,
          ),
      )
    );
  });

  if (visuals.length === 0) {
    throw new Error("Gemini returned no valid visual learning aids");
  }

  return visuals;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chapterId = body.chapter_id;

    if (typeof chapterId !== "string" || !chapterId) {
      return NextResponse.json(
        { success: false, error: "Missing chapter_id in request body" },
        { status: 400 },
      );
    }

    const { data: chapter, error: chapterError } = await supabaseAdmin
      .from("ebook_chapters")
      .select("id, content")
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch chapter: ${chapterError?.message || "Not found"}`,
        },
        { status: chapterError?.code === "PGRST116" ? 404 : 500 },
      );
    }

    if (typeof chapter.content !== "string" || !chapter.content.trim()) {
      return NextResponse.json(
        { success: false, error: "Chapter content is empty" },
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const prompt = `Based ONLY on the following chapter text, generate 5 to 8 visual learning aids. Return ONLY a valid JSON array with objects containing exactly these fields: "type" (one of "flowchart", "table", or "comparison"), "title" (string), and "content" (object). For "flowchart", content must be {"steps": ["string", ...]}. For "table" or "comparison", content must be {"headers": ["string", ...], "rows": [["string", ...], ...]}. Ensure every row has the same number of cells as headers. Do not use markdown, code fences, outside knowledge, or explanatory text.

Chapter text:
${chapter.content}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(
        `Gemini API error ${geminiResponse.status}: ${await geminiResponse.text()}`,
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof responseText !== "string" || !responseText.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    let visuals: GeneratedVisual[];
    try {
      visuals = parseVisuals(responseText);
    } catch (error) {
      throw new Error(
        `Gemini returned invalid JSON: ${
          error instanceof Error ? error.message : "Unable to parse response"
        }`,
      );
    }

    const rows = visuals.map((visual, index) => ({
      chapter_id: chapterId,
      type: visual.type,
      title: visual.title.trim(),
      content: visual.content,
      order_index: index,
    }));

    const { error: deleteError } = await supabaseAdmin
      .from("ebook_visuals")
      .delete()
      .eq("chapter_id", chapterId);

    if (deleteError) {
      throw new Error(
        `Failed to replace existing visuals: ${deleteError.message}`,
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("ebook_visuals")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert visuals: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
    });
  } catch (error) {
    console.error("Generate ebook visuals API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
