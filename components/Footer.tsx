"use client";

import { usePathname } from "next/navigation";
import InstallHint from "@/components/InstallHint";
import { useTheme } from "@/components/ThemeProvider";

export default function Footer() {
  const pathname = usePathname();
  const { theme, cycleTheme } = useTheme();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-gray-800 light:border-gray-200 bg-gray-950 light:bg-white px-4 py-8 text-center text-sm text-gray-400 light:text-gray-600 sm:px-6">
      <p>
        Missing a paper or found a problem?{" "}
        <a
          href="https://forms.gle/cL7FhSVQXziHkPPT8"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 light:text-blue-600 underline decoration-blue-400/50 light:decoration-blue-600/50 underline-offset-4 transition-colors hover:text-blue-300 light:hover:text-blue-700"
        >
          Report a problem / Request a paper
        </a>
      </p>
      <a
        href="/bookmarks"
        className="mt-4 inline-block font-medium text-blue-400 underline decoration-blue-400/50 underline-offset-4 transition-colors hover:text-blue-300 light:text-blue-600 light:decoration-blue-600/50 light:hover:text-blue-700"
      >
        Bookmarks
      </a>
      <button
        type="button"
        onClick={() => cycleTheme()}
        aria-label={`Switch theme from ${theme} mode`}
        title={`Theme: ${theme}`}
        className="mx-auto mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-700 light:border-gray-300 bg-gray-900 light:bg-gray-100 px-3 text-gray-300 light:text-gray-700 transition-colors hover:border-gray-600 light:hover:border-gray-400 hover:bg-gray-800 light:hover:bg-gray-200 hover:text-white light:hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60"
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
      <InstallHint />
    </footer>
  );
}
