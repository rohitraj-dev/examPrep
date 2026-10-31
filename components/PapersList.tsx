"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBookmarks,
  toggleBookmark,
  type BookmarkedPaper,
} from "@/lib/bookmarks";

type Paper = {
  id: string;
  subject_id?: string;
  subject_name?: string;
  year: number;
  exam_type: string;
  file_url: string;
  ocr_status: string;
  uploaded_at?: string | null;
  set_label?: string;
};

export default function PapersList({
  papers,
  subjectId,
  subjectName,
}: {
  papers: Paper[];
  subjectId: string;
  subjectName: string;
}) {
  const [year, setYear] = useState("all");
  const [examType, setExamType] = useState("all");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    setBookmarkedIds(new Set(getBookmarks().map((paper) => paper.id)));
  }, []);

  const handleToggleBookmark = (paper: Paper) => {
    const bookmark: BookmarkedPaper = {
      id: paper.id,
      subject_id: subjectId,
      subject_name: subjectName,
      year: paper.year,
      exam_type: paper.exam_type,
      file_url: paper.file_url,
    };
    const nextBookmarks = toggleBookmark(bookmark);
    setBookmarkedIds(new Set(nextBookmarks.map((item) => item.id)));
  };

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-300 light:text-gray-700">
          Year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-gray-700 light:border-gray-300 bg-gray-900 light:bg-white px-3 py-2.5 text-base font-normal text-gray-100 light:text-gray-900 outline-none transition-colors focus:border-blue-500 light:focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 light:focus:ring-blue-500/30"
          >
            <option value="all">All years</option>
            {years.map((paperYear) => (
              <option key={paperYear} value={paperYear}>
                {paperYear}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-gray-300 light:text-gray-700">
          Exam type
          <select
            value={examType}
            onChange={(event) => setExamType(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-gray-700 light:border-gray-300 bg-gray-900 light:bg-white px-3 py-2.5 text-base font-normal text-gray-100 light:text-gray-900 outline-none transition-colors focus:border-blue-500 light:focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 light:focus:ring-blue-500/30"
          >
            <option value="all">All exam types</option>
            <option value="mid-sem">Mid-sem</option>
            <option value="end-sem">End-sem</option>
          </select>
        </label>
      </div>

      {filteredPapers.length === 0 ? (
        <div className="rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white p-6 text-center text-gray-400 light:text-gray-600 sm:p-8">
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
              className="min-h-11 rounded-xl bg-blue-600 light:bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
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
            const isMidSem = paper.exam_type === "mid-sem";
            return (
              <div
                key={paper.id}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white p-5 shadow-lg shadow-black/10 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-gray-700 light:hover:border-gray-300 hover:shadow-xl hover:shadow-black/20 light:hover:shadow-gray-300/50 sm:p-6"
              >
                <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="flex flex-wrap items-center gap-2 break-words text-xl font-bold text-gray-200 light:text-gray-900">
                      <span>{paper.year}</span>
                      {paper.set_label && (
                        <span className="shrink-0 rounded border border-blue-800/60 light:border-blue-200 bg-blue-900/40 light:bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-300 light:text-blue-700">
                          {paper.set_label}
                        </span>
                      )}
                    </h3>
                    <p className="mt-2 flex min-w-0 items-center gap-2 break-words text-sm font-medium capitalize text-gray-400 light:text-gray-600">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-blue-300 light:border-gray-300 light:bg-gray-100 light:text-blue-700">
                        {isMidSem ? (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="size-4"
                          >
                            <rect x="4" y="5" width="16" height="15" rx="2" />
                            <path d="M8 3v4m8-4v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
                          </svg>
                        ) : (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="size-4"
                          >
                            <path d="M4 6.5 12 4l8 2.5L12 9 4 6.5Z" />
                            <path d="M7 8v5.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8M20 7v6" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0">{paper.exam_type.replace("-", " ")}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {paper.ocr_status === "done" && (
                      <span className="rounded border border-green-800/50 light:border-green-200 bg-green-900/30 light:bg-green-100 px-2 py-1 text-xs text-green-400 light:text-green-700">
                        OCR Done
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(paper)}
                      aria-label={
                        bookmarkedIds.has(paper.id)
                          ? "Remove bookmark"
                          : "Bookmark paper"
                      }
                      aria-pressed={bookmarkedIds.has(paper.id)}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-yellow-400 light:text-yellow-600 transition-colors hover:bg-gray-800 light:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill={bookmarkedIds.has(paper.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m12 3 2.78 5.63 6.22.9-4.5 4.38 1.06 6.19L12 17.18l-5.56 2.92 1.06-6.19L3 9.53l6.22-.9L12 3Z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full items-center justify-center truncate rounded-lg border border-gray-700 light:border-gray-300 bg-gray-800 light:bg-gray-100 px-4 py-2.5 text-center font-medium text-blue-300 light:text-blue-700 transition-colors hover:bg-gray-700 light:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
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
