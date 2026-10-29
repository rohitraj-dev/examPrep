"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
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

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const [subjectRes, papersRes, questionsRes] = await Promise.all([
          supabase.from("subjects").select("name, code, semester").eq("id", id).single(),
          supabase
            .from("papers")
            .select("id, year, exam_type, file_url, ocr_status, uploaded_at")
            .eq("subject_id", id)
            .not("file_url", "is", null)
            .order("year", { ascending: false })
            .order("exam_type", { ascending: true })
            .order("uploaded_at", { ascending: true }),
          supabase.from("ai_questions").select("question, confidence, generated_at").eq("subject_id", id).order("confidence", { ascending: false })
        ]);

        if (subjectRes.error) throw new Error(subjectRes.error.message || "Failed to load subject");
        
        setSubject(subjectRes.data);
        if (papersRes.data) {
          const sorted = [...papersRes.data].sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            const examCmp = (a.exam_type || "").localeCompare(b.exam_type || "");
            if (examCmp !== 0) return examCmp;
            const timeA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
            const timeB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
            return timeA - timeB;
          });

          const counts: Record<string, number> = {};
          for (const p of sorted) {
            const key = `${p.year}_${(p.exam_type || "").toLowerCase()}`;
            counts[key] = (counts[key] || 0) + 1;
          }

          const setIndex: Record<string, number> = {};
          const papersWithLabels = sorted.map((p) => {
            const key = `${p.year}_${(p.exam_type || "").toLowerCase()}`;
            if (counts[key] > 1) {
              setIndex[key] = (setIndex[key] || 0) + 1;
              return { ...p, set_label: `Set ${setIndex[key]}` };
            }
            return { ...p, set_label: undefined };
          });

          setPapers(papersWithLabels);
        }
        if (questionsRes.data) setQuestions(questionsRes.data);

      } catch (err: any) {
        console.error("Error fetching subject data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8 sm:p-6 md:p-12 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-400 mb-4"></div>
        <span className="text-gray-400 text-lg animate-pulse">Loading subject details...</span>
      </main>
    );
  }

  if (error || !subject) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8 sm:p-6 md:p-12">
        <div className="max-w-4xl mx-auto text-center py-16 sm:py-20 px-4 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-8 break-words">{error || "Subject not found."}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white min-h-[44px] px-6 py-2.5 rounded-xl transition-colors inline-flex items-center justify-center font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 px-4 py-8 sm:p-6 md:p-12 overflow-x-hidden">
      <div className="max-w-5xl mx-auto min-w-0">
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center min-h-[44px] py-2 px-1 -ml-1 transition-colors text-base">
            &larr; Back to Home
          </Link>
        </div>

        <header className="mb-8 sm:mb-12 border-b border-gray-800 pb-6 sm:pb-8 min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 flex items-center gap-3 sm:gap-4 flex-wrap break-words min-w-0">
            <span className="break-words">{subject.name}</span>
            {subject.code && (
              <span className="bg-gray-800 text-blue-300 text-base sm:text-lg md:text-2xl font-mono px-3 py-1 rounded-lg border border-gray-700 break-all shrink-0">
                {subject.code}
              </span>
            )}
          </h1>
          {subject.semester && (
            <p className="text-gray-400 text-base sm:text-lg">
              Semester: <span className="text-gray-200 font-semibold">{subject.semester}</span>
            </p>
          )}
        </header>

        <section className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-6 border-l-4 border-blue-500 pl-3 sm:pl-4">
            Previous Year Papers
          </h2>
          
          {papers.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sm:p-8 text-center text-gray-400">
              No papers found for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {papers.map((paper) => {
                const filename = paper.file_url ? paper.file_url.split("/").pop()?.split("?")[0] : "";
                return (
                  <div key={paper.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 sm:p-6 hover:border-gray-700 transition-colors shadow-lg flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start mb-4 gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-200 flex items-center gap-2 flex-wrap break-words">
                          <span>{paper.year}</span>
                          {paper.set_label && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/60 shrink-0">
                              {paper.set_label}
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base capitalize break-words mt-1">
                          {paper.exam_type.replace("-", " ")}
                        </p>
                      </div>
                      {paper.ocr_status === "done" && (
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-800/50 shrink-0">
                          OCR Done
                        </span>
                      )}
                    </div>
                    <a 
                      href={paper.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full text-center bg-gray-800 hover:bg-gray-700 text-blue-300 font-medium min-h-[44px] py-2.5 px-4 rounded-lg transition-colors border border-gray-700 flex items-center justify-center truncate"
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-100 mb-6 border-l-4 border-purple-500 pl-3 sm:pl-4">
            AI Predicted Questions
          </h2>
          
          {questions.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sm:p-8 text-center text-gray-400">
              No questions generated yet. Admins can generate questions from the upload panel.
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg min-w-0">
              <ul className="divide-y divide-gray-800">
                {questions.map((q, index) => (
                  <li key={index} className="p-4 sm:p-6 hover:bg-gray-800/50 transition-colors flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 min-w-0">
                    <span className="text-blue-400 font-mono text-lg sm:text-xl font-bold shrink-0">
                      Q{index + 1}.
                    </span>
                    <p className="text-gray-200 text-base sm:text-lg flex-1 leading-relaxed break-words min-w-0">
                      {q.question}
                    </p>
                    <div className="shrink-0 flex items-center gap-2 mt-1 sm:mt-0">
                      <span className="text-gray-400 text-sm">Confidence:</span>
                      <span className={`px-2.5 py-1 rounded text-sm font-semibold border ${
                        q.confidence >= 0.8 ? 'bg-green-900/30 text-green-300 border-green-800/50' : 
                        q.confidence >= 0.5 ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800/50' : 
                        'bg-red-900/30 text-red-300 border-red-800/50'
                      }`}>
                        {Math.round(q.confidence * 100)}%
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
