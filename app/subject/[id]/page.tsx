import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Subject = {
  name: string;
  code: string | null;
  semester: string | null;
};

type Paper = {
  id: string;
  year: number;
  exam_type: string;
  file_url: string;
  ocr_status: string;
  uploaded_at?: string | null;
  set_label?: string;
};

type AIQuestion = {
  question: string;
  confidence: number;
  generated_at: string;
};

function QueryError() {
  return (
    <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-4 py-12 text-center shadow-xl sm:px-8">
      <h2 className="mb-2 text-xl font-bold text-red-400 sm:text-2xl">
        Unable to load this subject
      </h2>
      <p className="mb-6 text-gray-400">
        We couldn&apos;t load the subject resources right now. Please try again
        later.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500"
      >
        ← Back
      </Link>
    </div>
  );
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [subjectRes, papersRes, questionsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("name, code, semester")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("papers")
      .select("id, year, exam_type, file_url, ocr_status, uploaded_at")
      .eq("subject_id", id)
      .not("file_url", "is", null)
      .order("year", { ascending: false })
      .order("exam_type", { ascending: true })
      .order("uploaded_at", { ascending: true }),
    supabase
      .from("ai_questions")
      .select("question, confidence, generated_at")
      .eq("subject_id", id)
      .order("confidence", { ascending: false }),
  ]);

  if (subjectRes.error || papersRes.error || questionsRes.error) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <QueryError />
        </div>
      </main>
    );
  }

  if (!subjectRes.data) {
    notFound();
  }

  const subject = subjectRes.data as Subject;
  const papers = (papersRes.data ?? []) as Paper[];
  const questions = (questionsRes.data ?? []) as AIQuestion[];
  const sortedPapers = [...papers].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const examCmp = (a.exam_type || "").localeCompare(b.exam_type || "");
    if (examCmp !== 0) return examCmp;
    const timeA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
    const timeB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
    return timeA - timeB;
  });
  const counts: Record<string, number> = {};
  for (const paper of sortedPapers) {
    const key = `${paper.year}_${(paper.exam_type || "").toLowerCase()}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const setIndex: Record<string, number> = {};
  const papersWithLabels = sortedPapers.map((paper) => {
    const key = `${paper.year}_${(paper.exam_type || "").toLowerCase()}`;
    if (counts[key] > 1) {
      setIndex[key] = (setIndex[key] || 0) + 1;
      return { ...paper, set_label: `Set ${setIndex[key]}` };
    }
    return { ...paper, set_label: undefined };
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl min-w-0">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center px-1 py-2 text-base font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            ← Back
          </Link>
        </div>

        <header className="mb-10 min-w-0 border-b border-gray-800 pb-6 sm:mb-12 sm:pb-8">
          <h1 className="mb-4 flex min-w-0 flex-wrap items-center gap-3 break-words text-3xl font-extrabold text-white sm:gap-4 lg:text-5xl">
            <span className="break-words">{subject.name}</span>
            {subject.code && (
              <span className="shrink-0 break-all rounded-lg border border-gray-700 bg-gray-800 px-3 py-1 font-mono text-base text-blue-300 sm:text-lg lg:text-2xl">
                {subject.code}
              </span>
            )}
          </h1>
          {subject.semester && (
            <p className="text-base text-gray-400 sm:text-lg">
              Semester:{" "}
              <span className="font-semibold text-gray-200">
                {subject.semester}
              </span>
            </p>
          )}
        </header>

        <section className="mb-12 sm:mb-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-100">
            Previous Year Papers
          </h2>
          {papersWithLabels.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400 sm:p-8">
              No papers found for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {papersWithLabels.map((paper) => {
                const filename = paper.file_url
                  ? paper.file_url.split("/").pop()?.split("?")[0]
                  : "";
                return (
                  <div
                    key={paper.id}
                    className="flex min-w-0 flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-lg transition-colors hover:border-gray-700 sm:p-6"
                  >
                    <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="flex flex-wrap items-center gap-2 break-words text-xl font-bold text-gray-200">
                          <span>{paper.year}</span>
                          {paper.set_label && (
                            <span className="shrink-0 rounded border border-blue-800/60 bg-blue-900/40 px-2 py-0.5 text-xs font-semibold text-blue-300">
                              {paper.set_label}
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 break-words text-base capitalize text-gray-400">
                          {paper.exam_type.replace("-", " ")}
                        </p>
                      </div>
                      {paper.ocr_status === "done" && (
                        <span className="shrink-0 rounded border border-green-800/50 bg-green-900/30 px-2 py-1 text-xs text-green-400">
                          OCR Done
                        </span>
                      )}
                    </div>
                    <a
                      href={paper.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 w-full items-center justify-center truncate rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-center font-medium text-blue-300 transition-colors hover:bg-gray-700"
                      title={filename ? `Download ${filename}` : "Download PDF"}
                    >
                      <span className="truncate">Download PDF</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-100">
            AI Predicted Questions
          </h2>
          {questions.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400 sm:p-8">
              No questions generated yet. Admins can generate questions from
              the upload panel.
            </div>
          ) : (
            <div className="min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-lg">
              <ul className="divide-y divide-gray-800">
                {questions.map((question, index) => (
                  <li
                    key={`${question.generated_at}-${index}`}
                    className="flex min-w-0 flex-col gap-3 p-4 transition-colors hover:bg-gray-800/50 sm:flex-row sm:items-start sm:gap-4 sm:p-6"
                  >
                    <span className="shrink-0 font-mono text-lg font-bold text-blue-400 sm:text-xl">
                      Q{index + 1}.
                    </span>
                    <p className="min-w-0 flex-1 break-words text-base leading-relaxed text-gray-200 sm:text-lg">
                      {question.question}
                    </p>
                    <div className="mt-1 flex shrink-0 items-center gap-2 sm:mt-0">
                      <span className="text-sm text-gray-400">Confidence:</span>
                      <span
                        className={`rounded border px-2.5 py-1 text-sm font-semibold ${
                          question.confidence >= 0.8
                            ? "border-green-800/50 bg-green-900/30 text-green-300"
                            : question.confidence >= 0.5
                              ? "border-yellow-800/50 bg-yellow-900/30 text-yellow-300"
                              : "border-red-800/50 bg-red-900/30 text-red-300"
                        }`}
                      >
                        {Math.round(question.confidence * 100)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
