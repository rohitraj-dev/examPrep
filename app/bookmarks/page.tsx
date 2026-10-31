"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBookmarks,
  toggleBookmark,
  type BookmarkedPaper,
} from "@/lib/bookmarks";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedPaper[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const groupedBookmarks = useMemo(() => {
    return bookmarks.reduce<Record<string, BookmarkedPaper[]>>(
      (groups, bookmark) => {
        const subjectName = bookmark.subject_name || "Unknown subject";
        groups[subjectName] ??= [];
        groups[subjectName].push(bookmark);
        return groups;
      },
      {},
    );
  }, [bookmarks]);

  const handleRemoveBookmark = (bookmark: BookmarkedPaper) => {
    setBookmarks(toggleBookmark(bookmark));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center sm:mb-14">
          <h1 className="mb-4 text-3xl font-extrabold text-blue-300 light:text-blue-700 sm:text-4xl">
            Bookmarks
          </h1>
          <p className="text-base text-gray-400 light:text-gray-600 sm:text-lg">
            Your saved question papers.
          </p>
        </header>

        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-12 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8">
            <p className="mb-6 text-lg text-gray-300 light:text-gray-700">
              No bookmarks yet
            </p>
            <a
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 light:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
            >
              Back to home
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedBookmarks).map(([subjectName, papers]) => (
              <section key={subjectName}>
                <h2 className="mb-4 break-words text-2xl font-bold text-gray-200 light:text-gray-900">
                  {subjectName}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {papers.map((paper) => (
                    <div
                      key={paper.id}
                      className="flex min-w-0 flex-col justify-between rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-lg transition-colors hover:border-gray-700 light:border-gray-200 light:bg-white light:hover:border-gray-300 sm:p-6"
                    >
                      <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-xl font-bold text-gray-200 light:text-gray-900">
                            {paper.year}
                          </h3>
                          <p className="mt-1 break-words text-base capitalize text-gray-400 light:text-gray-600">
                            {paper.exam_type.replace("-", " ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBookmark(paper)}
                          aria-label={`Remove bookmark for ${paper.year} ${paper.exam_type} paper`}
                          className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-yellow-400 transition-colors hover:bg-gray-800 light:text-yellow-600 light:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m12 3 2.78 5.63 6.22.9-4.5 4.38 1.06 6.19L12 17.18l-5.56 2.92 1.06-6.19L3 9.53l6.22-.9L12 3Z" />
                          </svg>
                        </button>
                      </div>
                      <a
                        href={paper.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 w-full items-center justify-center truncate rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-center font-medium text-blue-300 transition-colors hover:bg-gray-700 light:border-gray-300 light:bg-gray-100 light:text-blue-700 light:hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
                      >
                        <span className="truncate">Download PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
