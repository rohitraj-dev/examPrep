"use client";

import { useMemo, useState } from "react";

type Paper = {
  id: string;
  year: number;
  exam_type: string;
  file_url: string;
  ocr_status: string;
  uploaded_at?: string | null;
  set_label?: string;
};

export default function PapersList({ papers }: { papers: Paper[] }) {
  const [year, setYear] = useState("all");
  const [examType, setExamType] = useState("all");
  const years = useMemo(
    () => [...new Set(papers.map((paper) => paper.year))].sort((a, b) => b - a),
    [papers],
  );
  const filteredPapers = useMemo(
    () =>
      papers.filter(
        (paper) =>
          (year === "all" || paper.year.toString() === year) &&
          (examType === "all" || paper.exam_type === examType),
      ),
    [examType, papers, year],
  );
  const hasFilters = year !== "all" || examType !== "all";

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-300">
          Year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-base font-normal text-gray-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All years</option>
            {years.map((paperYear) => (
              <option key={paperYear} value={paperYear}>
                {paperYear}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-300">
          Exam type
          <select
            value={examType}
            onChange={(event) => setExamType(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-base font-normal text-gray-100 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="all">All exam types</option>
            <option value="mid-sem">Mid-sem</option>
            <option value="end-sem">End-sem</option>
          </select>
        </label>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-gray-400 sm:p-8">
          <p className="mb-6">
            {hasFilters
              ? "No papers match the selected filters."
              : "No papers found for this subject yet."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setYear("all");
                setExamType("all");
              }}
              className="min-h-11 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPapers.map((paper) => {
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
                  className="flex min-h-11 w-full items-center justify-center truncate rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-center font-medium text-blue-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
                  title={filename ? `Download ${filename}` : "Download PDF"}
                >
                  <span className="truncate">Download PDF</span>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
