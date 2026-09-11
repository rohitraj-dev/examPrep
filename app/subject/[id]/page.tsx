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
          supabase.from("papers").select("id, year, exam_type, file_url, ocr_status").eq("subject_id", id).not("file_url", "is", null).order("year", { ascending: false }),
          supabase.from("ai_questions").select("question, confidence, generated_at").eq("subject_id", id).order("confidence", { ascending: false })
        ]);

        if (subjectRes.error) throw new Error(subjectRes.error.message || "Failed to load subject");
        
        setSubject(subjectRes.data);
        if (papersRes.data) setPapers(papersRes.data);
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
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-400 mb-4"></div>
        <span className="text-gray-400 text-lg animate-pulse">Loading subject details...</span>
      </main>
    );
  }

  if (error || !subject) {
    return (
      <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
        <div className="max-w-4xl mx-auto text-center py-20 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-400 mb-8">{error || "Subject not found."}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <header className="mb-12 border-b border-gray-800 pb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 flex items-center gap-4 flex-wrap">
            {subject.name}
            {subject.code && (
              <span className="bg-gray-800 text-blue-300 text-lg md:text-2xl font-mono px-3 py-1 rounded-lg border border-gray-700">
                {subject.code}
              </span>
            )}
          </h1>
          {subject.semester && (
            <p className="text-gray-400 text-lg">
              Semester: <span className="text-gray-300 font-semibold">{subject.semester}</span>
            </p>
          )}
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 border-l-4 border-blue-500 pl-4">
            Previous Year Papers
          </h2>
          
          {papers.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
              No papers found for this subject yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => (
                <div key={paper.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-200">{paper.year}</h3>
                      <p className="text-gray-400 capitalize">{paper.exam_type.replace("-", " ")}</p>
                    </div>
                    {paper.ocr_status === "done" && (
                      <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-800/50">
                        OCR Done
                      </span>
                    )}
                  </div>
                  <a 
                    href={paper.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gray-800 hover:bg-gray-700 text-blue-300 font-medium py-2 px-4 rounded-lg transition-colors border border-gray-700"
                  >
                    Download PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-100 mb-6 border-l-4 border-purple-500 pl-4">
            AI Predicted Questions
          </h2>
          
          {questions.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
              No questions generated yet. Admins can generate questions from the upload panel.
            </div>
          ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
              <ul className="divide-y divide-gray-800">
                {questions.map((q, index) => (
                  <li key={index} className="p-6 hover:bg-gray-800/50 transition-colors flex flex-col md:flex-row md:items-start gap-4">
                    <span className="text-blue-500 font-mono text-xl font-bold flex-shrink-0">
                      Q{index + 1}.
                    </span>
                    <p className="text-gray-200 text-lg flex-1 leading-relaxed">
                      {q.question}
                    </p>
                    <div className="flex-shrink-0 flex items-center gap-2 mt-2 md:mt-0">
                      <span className="text-gray-500 text-sm">Confidence:</span>
                      <span className={`px-2.5 py-1 rounded text-sm font-semibold border ${
                        q.confidence >= 0.8 ? 'bg-green-900/30 text-green-400 border-green-800/50' : 
                        q.confidence >= 0.5 ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50' : 
                        'bg-red-900/30 text-red-400 border-red-800/50'
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
