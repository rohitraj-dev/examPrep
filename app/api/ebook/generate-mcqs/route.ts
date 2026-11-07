import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

type GeneratedMcq = {
  question: string;
  options: string[];
  correct_answer: string;
};

function parseMcqs(responseText: string): GeneratedMcq[] {
  const stripped = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const parsed: unknown = JSON.parse(stripped);

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini did not return an array");
  }

  const mcqs = parsed.filter((item): item is GeneratedMcq => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.question === "string" &&
      candidate.question.trim().length > 0 &&
      Array.isArray(candidate.options) &&
      candidate.options.length === 4 &&
      candidate.options.every(
        (option) => typeof option === "string" && option.trim().length > 0,
      ) &&
      typeof candidate.correct_answer === "string" &&
      candidate.correct_answer.trim().length > 0
    );
  });

  if (mcqs.length === 0) {
    throw new Error("Gemini returned no valid MCQs");
  }

  return mcqs;
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
    const prompt = `Based ONLY on the following chapter text, generate 15 to 20 multiple-choice questions covering the whole chapter. Each question must have exactly four answer options and one correct answer. Return ONLY a strict JSON array with objects containing exactly these fields: "question" (string), "options" (array of exactly four strings), and "correct_answer" (string matching one option). Do not use markdown, code fences, outside knowledge, or explanatory text.

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

    let mcqs: GeneratedMcq[];
    try {
      mcqs = parseMcqs(responseText);
    } catch (error) {
      throw new Error(
        `Gemini returned invalid JSON: ${
          error instanceof Error ? error.message : "Unable to parse response"
        }`,
      );
    }

    const rows = mcqs.map((mcq, index) => ({
      chapter_id: chapterId,
      question: mcq.question.trim(),
      options: mcq.options.map((option) => option.trim()),
      correct_answer: mcq.correct_answer.trim(),
      order_index: index,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("ebook_mcqs")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert MCQs: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
    });
  } catch (error) {
    console.error("Generate ebook MCQs API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
