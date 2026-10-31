"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
};

export default function SubjectGrid({ subjects }: { subjects: Subject[] }) {
  const [search, setSearch] = useState("");
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

  return (
    <>
      <div className="mb-6">
        <label htmlFor="subject-search" className="sr-only">
          Search subjects
        </label>
        <input
          id="subject-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by subject name or code"
          className="min-h-11 w-full rounded-xl border border-gray-700 light:border-gray-300 bg-gray-900 light:bg-white px-4 py-2.5 text-base text-gray-100 light:text-gray-900 outline-none transition-colors placeholder:text-gray-500 light:placeholder:text-gray-400 focus:border-blue-500 light:focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 light:focus:ring-blue-500/30"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="rounded-2xl border border-gray-800 light:border-gray-200 bg-gray-900 light:bg-white px-4 py-12 text-center shadow-xl sm:px-8">
          <h2 className="mb-2 text-xl font-bold text-gray-300 light:text-gray-700 sm:text-2xl">
            No subjects match your search
          </h2>
          <p className="mb-6 text-gray-400 light:text-gray-600">
            Try a different subject name or code.
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="min-h-11 rounded-xl bg-blue-600 light:bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
          >
            Clear search
          </button>
        </div>
      ) : (
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
                className="mt-auto flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 light:bg-blue-600 px-4 py-2.5 text-center font-medium text-white shadow-lg shadow-blue-900/20 light:shadow-blue-200/50 transition-colors hover:bg-blue-500 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
              >
                View Papers
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
