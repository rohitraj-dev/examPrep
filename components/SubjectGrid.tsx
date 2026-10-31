"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import Link from "next/link";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
};

type Paper = {
  id: string;
  subject_id: string;
  year: number;
  exam_type: string;
};

export default function SubjectGrid({
  subjects,
  papers,
}: {
  subjects: Subject[];
  papers: Paper[];
}) {
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.name.toLowerCase().includes(normalizedSearch) ||
          subject.code?.toLowerCase().includes(normalizedSearch),
      ),
    [normalizedSearch, subjects],
  );
  const filteredPapers = useMemo(
    () => {
      if (!normalizedSearch) return [];

      return papers.filter(
        (paper) =>
          paper.year.toString().includes(normalizedSearch) ||
          paper.exam_type.toLowerCase().includes(normalizedSearch),
      );
    },
    [normalizedSearch, papers],
  );
  const subjectsById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );
  const hasResults = filteredSubjects.length > 0 || filteredPapers.length > 0;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`transition-opacity duration-500 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className="mb-6">
        <label htmlFor="subject-search" className="sr-only">
          Search subjects
        </label>
        <input
          id="subject-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by subject, year, or exam type"
          className="min-h-11 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-base text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 light:border-gray-300 light:bg-gray-50 light:text-gray-900 light:placeholder:text-gray-500 light:focus:border-blue-600 light:focus:ring-blue-500/30"
        />
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white px-4 py-12 text-center shadow-xl sm:px-8">
          <h2 className="mb-2 text-xl font-bold text-gray-300 light:text-gray-700 sm:text-2xl">
            No subjects or papers match your search
          </h2>
          <p className="mb-6 text-gray-400 light:text-gray-600">
            Try a different subject, year, or exam type.
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="min-h-11 rounded-xl bg-blue-600 light:bg-blue-600 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:bg-blue-500 light:hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredSubjects.length > 0 && (
            <section aria-labelledby="subjects-results-heading">
              <h2
                id="subjects-results-heading"
                className="mb-5 text-2xl font-bold text-gray-100 light:text-gray-900"
              >
                Subjects
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex min-w-0 flex-col rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gray-700 light:hover:border-gray-300 hover:shadow-2xl sm:p-6"
                  >
                    <div className="flex-1">
                      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
                        <h2 className="line-clamp-2 min-w-0 flex-1 break-words text-xl font-bold text-gray-100 light:text-gray-900">
                          {subject.name}
                        </h2>
                        {subject.code && (
                          <span className="shrink-0 rounded-md border border-gray-700 light:border-gray-300 bg-gray-800 light:bg-gray-100 px-2.5 py-1 font-mono text-xs text-blue-300 light:text-blue-700">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      {subject.semester && (
                        <div className="mb-6 inline-block rounded-full border border-purple-800/50 light:border-purple-200 bg-purple-900/30 light:bg-purple-100 px-3 py-1 text-sm text-purple-300 light:text-purple-700">
                          Semester:{" "}
                          <span className="font-semibold">{subject.semester}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/subject/${subject.id}`}
                      className="mt-auto flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 light:bg-blue-600 px-4 py-2.5 text-center font-medium text-white shadow-lg shadow-blue-900/20 light:shadow-blue-200/50 transition-all duration-200 hover:bg-blue-500 light:hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
                    >
                      View Papers
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredPapers.length > 0 && (
            <section aria-labelledby="papers-results-heading">
              <h2
                id="papers-results-heading"
                className="mb-5 text-2xl font-bold text-gray-100 light:text-gray-900"
              >
                Papers
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPapers.map((paper) => {
                  const subject = subjectsById.get(paper.subject_id);
                  if (!subject) return null;

                  return (
                    <Link
                      key={paper.id}
                      href={`/subject/${paper.subject_id}`}
                      className="group flex min-w-0 items-center justify-between gap-4 rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-700 light:hover:border-blue-300 hover:shadow-lg active:scale-[0.99] sm:p-5"
                    >
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-100 light:text-gray-900">
                          {subject.name}
                        </h3>
                        <p className="mt-1 text-sm capitalize text-gray-400 light:text-gray-600">
                          {paper.exam_type.replace("-", " ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-lg font-bold text-blue-300 light:text-blue-700">
                        {paper.year}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
