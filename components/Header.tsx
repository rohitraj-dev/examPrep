"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function Header() {
  const pathname = usePathname();
  const { theme, cycleTheme } = useTheme();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="border-b border-gray-800 light:border-gray-200 bg-gray-950 light:bg-white">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="min-w-0 truncate text-lg font-extrabold tracking-tight text-blue-300 transition-colors hover:text-blue-200 light:text-blue-700 light:hover:text-blue-800"
        >
          ExamPrep
        </a>

        <nav aria-label="Primary navigation" className="flex shrink-0 items-center gap-2">
          <a
            href="/bookmarks"
            className="inline-flex min-h-10 items-center rounded-lg px-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-900 hover:text-white light:text-gray-700 light:hover:bg-gray-100 light:hover:text-gray-950 sm:px-3"
          >
            Bookmarks
          </a>
          <button
            type="button"
            onClick={() => cycleTheme()}
            aria-label={`Switch theme from ${theme} mode`}
            title={`Theme: ${theme}`}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white light:border-gray-300 light:bg-gray-100 light:text-gray-700 light:hover:border-gray-400 light:hover:bg-gray-200 light:hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
          >
            {theme === "light" ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
