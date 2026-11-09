import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

type GeneratedDefinition = {
  term: string;
  definition: string;
};

function parseDefinitions(responseText: string): GeneratedDefinition[] {
  const stripped = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const parsed: unknown = JSON.parse(stripped);

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini did not return an array");
  }

  const definitions = parsed.filter((item): item is GeneratedDefinition => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.term === "string" &&
      candidate.term.trim().length > 0 &&
      typeof candidate.definition === "string" &&
      candidate.definition.trim().length > 0
    );
  });

  if (definitions.length === 0) {
    throw new Error("Gemini returned no valid definitions");
  }

  return definitions;
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
    const prompt = `Based ONLY on the following chapter text, generate 15 to 20 important terms from the chapter. Give each term a concise one-line definition. Return ONLY a strict JSON array with objects containing exactly these fields: "term" (string) and "definition" (string). Do not use markdown, code fences, outside knowledge, or explanatory text.

Chapter text:
${chapter.content}`;
    const geminiBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    const backoffs = [2000, 4000, 8000];
    let geminiResponse: Response | undefined;

    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });

      if (response.ok) {
        geminiResponse = response;
        break;
      }

      if ([429, 500, 503].includes(response.status) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, backoffs[attempt]));
        continue;
      }

      throw new Error(
        `Gemini API error ${response.status}: ${await response.text()}`,
      );
    }

    if (!geminiResponse) {
      throw new Error("Gemini request failed");
    }

    const geminiData = await geminiResponse.json();
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof responseText !== "string" || !responseText.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    let definitions: GeneratedDefinition[];
    try {
      definitions = parseDefinitions(responseText);
    } catch (error) {
      throw new Error(
        `Gemini returned invalid JSON: ${
          error instanceof Error ? error.message : "Unable to parse response"
        }`,
      );
    }

    const rows = definitions.map((definition, index) => ({
      chapter_id: chapterId,
      term: definition.term.trim(),
      definition: definition.definition.trim(),
      order_index: index,
    }));

    const { error: deleteError } = await supabaseAdmin
      .from("ebook_definitions")
      .delete()
      .eq("chapter_id", chapterId);

    if (deleteError) {
      throw new Error(
        `Failed to replace existing definitions: ${deleteError.message}`,
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("ebook_definitions")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert definitions: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
    });
  } catch (error) {
    console.error("Generate ebook definitions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
