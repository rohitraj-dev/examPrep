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
    <footer className="border-t border-gray-800/80 bg-gray-950 px-4 pb-4 pt-10 text-center text-sm text-gray-400 light:border-gray-200/80 light:bg-white light:text-gray-600 sm:px-6 sm:pb-6 sm:pt-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6">
      <p className="max-w-xl leading-6">
        Missing a paper or found a problem?{" "}
        <a
          href="https://forms.gle/cL7FhSVQXziHkPPT8"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 underline decoration-blue-400/50 underline-offset-4 transition-colors hover:text-blue-300 active:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 light:text-blue-600 light:decoration-blue-600/50 light:hover:text-blue-700 light:focus-visible:ring-blue-500/60"
        >
          Report a problem / Request a paper
        </a>
      </p>
      <nav aria-label="Footer navigation" className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
        <a
          href="/bookmarks"
          className="inline-flex min-h-10 items-center rounded-lg px-3 py-1 font-medium text-blue-400 underline decoration-blue-400/50 underline-offset-4 transition-colors hover:bg-gray-900 hover:text-blue-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 light:text-blue-600 light:decoration-blue-600/50 light:hover:bg-gray-100 light:hover:text-blue-700 light:focus-visible:ring-blue-500/60"
        >
          Bookmarks
        </a>
        <button
        type="button"
        onClick={() => cycleTheme()}
        aria-label={`Switch theme from ${theme} mode`}
        title={`Theme: ${theme}`}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-700 bg-gray-900 px-3 text-gray-300 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800 hover:text-white active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 light:border-gray-300 light:bg-gray-100 light:text-gray-700 light:hover:border-gray-400 light:hover:bg-gray-200 light:hover:text-gray-950 light:focus-visible:ring-blue-500/60"
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
      <InstallHint />
      </div>
    </footer>
  );
}
