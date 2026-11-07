import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const [{ data: chapters, error: chaptersError }, { data: subjects, error: subjectsError }, { data: mcqs, error: mcqsError }] =
      await Promise.all([
        supabaseAdmin
          .from("ebook_chapters")
          .select("id, chapter_title, subject_id, order_index"),
        supabaseAdmin.from("subjects").select("id, name"),
        supabaseAdmin.from("ebook_mcqs").select("chapter_id"),
      ]);

    if (chaptersError || subjectsError || mcqsError) {
      return NextResponse.json(
        {
          error:
            chaptersError?.message ||
            subjectsError?.message ||
            mcqsError?.message ||
            "Failed to fetch ebook chapters",
        },
        { status: 500 },
      );
    }

    const subjectNames = new Map(
      (subjects ?? []).map((subject) => [subject.id, subject.name]),
    );
    const mcqCounts = new Map<string, number>();

    for (const mcq of mcqs ?? []) {
      mcqCounts.set(
        mcq.chapter_id,
        (mcqCounts.get(mcq.chapter_id) ?? 0) + 1,
      );
    }

    const result = (chapters ?? [])
      .map((chapter) => ({
        id: chapter.id,
        chapter_title: chapter.chapter_title,
        subject_id: chapter.subject_id,
        order_index: chapter.order_index,
        subject_name: subjectNames.get(chapter.subject_id) ?? "Unknown subject",
        mcq_count: mcqCounts.get(chapter.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          a.subject_name.localeCompare(b.subject_name) ||
          a.order_index - b.order_index,
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch ebook chapters API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch ebook chapters",
      },
      { status: 500 },
    );
  }
}
