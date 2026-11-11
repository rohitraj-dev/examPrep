import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const subjectId = new URL(request.url).searchParams.get("subject_id");

  if (!subjectId) {
    return NextResponse.json(
      { error: "Missing subject_id query parameter" },
      { status: 400 },
    );
  }

  try {
    const { data: chapters, error: chaptersError } = await supabase
      .from("ebook_chapters")
      .select("id, order_index")
      .eq("subject_id", subjectId)
      .order("order_index");

    if (chaptersError) {
      throw new Error(`Failed to fetch ebook chapters: ${chaptersError.message}`);
    }

    if (!chapters || chapters.length === 0) {
      return NextResponse.json([]);
    }

    const chapterOrder = new Map(
      chapters.map((chapter, index) => [chapter.id, index]),
    );
    const chapterIds = chapters.map((chapter) => chapter.id);

    const { data: visuals, error: visualsError } = await supabase
      .from("ebook_visuals")
      .select("id, type, title, content, chapter_id, order_index")
      .in("chapter_id", chapterIds)
      .order("order_index");

    if (visualsError) {
      throw new Error(`Failed to fetch ebook visuals: ${visualsError.message}`);
    }

    const sortedVisuals = (visuals ?? []).sort(
      (a, b) =>
        (chapterOrder.get(a.chapter_id) ?? 0) -
          (chapterOrder.get(b.chapter_id) ?? 0) ||
        a.order_index - b.order_index,
    );

    return NextResponse.json(
      sortedVisuals.map(({ id, type, title, content, chapter_id }) => ({
        id,
        type,
        title,
        content,
        chapter_id,
      })),
    );
  } catch (error) {
    console.error("Fetch ebook visuals API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch ebook visuals",
      },
      { status: 500 },
    );
  }
}
