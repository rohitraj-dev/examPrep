"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Definition = {
  term: string;
  definition: string;
  chapter_id: string;
};

type PageState = "loading" | "ready" | "empty" | "error";

export default function DefinitionsPage() {
  const { id } = useParams<{ id: string }>();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDefinitions() {
      setState("loading");

      try {
        const response = await fetch(
          `/api/ebook/definitions?subject_id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load definitions");
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid definitions response");
        }

        const nextDefinitions = data as Definition[];
        setDefinitions(nextDefinitions);
        setState(nextDefinitions.length > 0 ? "ready" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("error");
      }
    }

    void loadDefinitions();

    return () => controller.abort();
  }, [id]);

  if (state === "loading") {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-white light:text-gray-900 sm:text-4xl">
          Glossary
        </h1>

        {state === "empty" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8">
            <p className="text-gray-400 light:text-gray-600">
              No definitions available yet for this subject.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-red-200 light:bg-white sm:px-8">
            <p className="text-red-400 light:text-red-700">
              Unable to load definitions. Please try again later.
            </p>
          </div>
        )}

        {state === "ready" && (
          <div className="divide-y divide-gray-800 rounded-2xl border border-gray-800 bg-gray-900 shadow-xl light:divide-gray-200 light:border-gray-200 light:bg-white">
            {definitions.map((item, index) => (
              <article
                key={`${item.chapter_id}-${item.term}-${index}`}
                className="px-5 py-5 sm:px-8 sm:py-6"
              >
                <h2 className="text-lg font-bold text-white light:text-gray-900">
                  {item.term}
                </h2>
                <p className="mt-2 break-words leading-relaxed text-gray-300 light:text-gray-700">
                  {item.definition}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl animate-pulse">
        <div className="mb-8 h-9 w-36 rounded bg-gray-800 light:bg-gray-200" />
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-8">
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-6 w-2/5 rounded bg-gray-800 light:bg-gray-200" />
                <div className="h-5 w-full rounded bg-gray-800 light:bg-gray-200" />
                <div className="h-5 w-4/5 rounded bg-gray-800 light:bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
