import { NextResponse } from "next/server";
import { Agent, setGlobalDispatcher } from "undici";
import { GEMINI_MODEL } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase-admin";

setGlobalDispatcher(new Agent({ headersTimeout: 600000, bodyTimeout: 600000 }));

type SyllabusModule = {
  module_number: number;
  title: string;
  topics: string;
};

type ModuleExtraction = {
  module_1: string;
  module_2: string;
  module_3: string;
  module_4: string;
  module_5: string;
};

function parseModuleExtraction(responseText: string): ModuleExtraction {
  const stripped = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const parsed: unknown = JSON.parse(stripped);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini did not return an object");
  }

  const candidate = parsed as Record<string, unknown>;
  const keys = [
    "module_1",
    "module_2",
    "module_3",
    "module_4",
    "module_5",
  ] as const;

  if (
    Object.keys(candidate).length !== keys.length ||
    !keys.every((key) => typeof candidate[key] === "string")
  ) {
    throw new Error("Gemini returned an invalid module extraction object");
  }

  return candidate as ModuleExtraction;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chapterId = body.chapter_id;
    const syllabusModules = body.syllabus_modules;
    const hasOverrideContent = body.override_content !== undefined;

    if (typeof chapterId !== "string" || !chapterId) {
      return NextResponse.json(
        { success: false, error: "Missing chapter_id in request body" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(syllabusModules) ||
      syllabusModules.length !== 5 ||
      !syllabusModules.every(
        (module): module is SyllabusModule =>
          module !== null &&
          typeof module === "object" &&
          typeof module.module_number === "number" &&
          typeof module.title === "string" &&
          module.title.trim().length > 0 &&
          typeof module.topics === "string" &&
          module.topics.trim().length > 0,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "syllabus_modules must be an array of 5 valid module objects",
        },
        { status: 400 },
      );
    }

    if (
      hasOverrideContent &&
      (typeof body.override_content !== "string" ||
        !body.override_content.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "override_content must be a non-empty string",
        },
        { status: 400 },
      );
    }

    let chapterContent: string;
    if (hasOverrideContent) {
      chapterContent = body.override_content;
    } else {
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

      chapterContent = chapter.content;
    }

    if (typeof chapterContent !== "string" || !chapterContent.trim()) {
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL_OVERRIDE || GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const prompt = `Go through the complete chapter content below and, for EACH syllabus module, extract and copy only the portions of the chapter that are relevant to that module's topics. Include relevant paragraphs, examples, and explanations. Preserve the original wording exactly; do not summarize, rewrite, or add outside knowledge. If no content in the chapter is relevant to a module, use an empty string for that module. Return ONLY valid JSON with exactly these string fields: "module_1", "module_2", "module_3", "module_4", and "module_5". Do not use markdown, code fences, or explanatory text.

Syllabus modules:
${JSON.stringify(syllabusModules, null, 2)}

Complete chapter content:
${chapterContent}`;
    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 65536 },
    });
    let geminiResponse: Response | undefined;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      if (geminiResponse.status !== 503 || attempt === maxRetries) {
        break;
      }

      const waitTime = 10 * 2 ** attempt;
      await geminiResponse.text();
      console.log(
        `Gemini API retry attempt ${attempt + 1}/${maxRetries}: waiting ${waitTime}s after 503 response`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }

    if (!geminiResponse?.ok) {
      throw new Error(
        `Gemini API error ${geminiResponse?.status}: ${await geminiResponse?.text()}`,
      );
    }

    const geminiData = await geminiResponse.json();
    if (geminiData.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      throw new Error(
        "Gemini response truncated (hit max output tokens) — reduce input content size and retry",
      );
    }
    const responseText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof responseText !== "string" || !responseText.trim()) {
      throw new Error("Gemini returned an empty response");
    }

    try {
      return NextResponse.json(parseModuleExtraction(responseText));
    } catch (error) {
      throw new Error(
        `Gemini returned invalid JSON (finishReason: ${
          geminiData.candidates?.[0]?.finishReason
        }): ${
          error instanceof Error ? error.message : "Unable to parse response"
        } | responseText preview: ${responseText.slice(0, 500)}`,
      );
    }
  } catch (error) {
    console.error("Extract ebook content by module API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}
