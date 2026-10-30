"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl border border-red-900/60 bg-gray-900 px-4 py-12 text-center shadow-xl sm:px-8">
        <h1 className="mb-3 text-2xl font-bold text-red-400 sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mb-6 text-gray-400">
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
