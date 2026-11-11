"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Visual = {
  id: string;
  type: "flowchart" | "table" | "comparison";
  title: string;
  content: {
    steps?: string[];
    headers?: string[];
    rows?: string[][];
  };
  chapter_id: string;
};

type PageState = "loading" | "ready" | "empty" | "error";

export default function VisualsPage() {
  const { id } = useParams<{ id: string }>();
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadVisuals() {
      setState("loading");

      try {
        const response = await fetch(
          `/api/ebook/visuals?subject_id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load visual learning aids");
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid visual learning aids response");
        }

        const nextVisuals = data as Visual[];
        setVisuals(nextVisuals);
        setState(nextVisuals.length > 0 ? "ready" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("error");
      }
    }

    void loadVisuals();

    return () => controller.abort();
  }, [id]);

  if (state === "loading") {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-white light:text-gray-900 sm:text-4xl">
          Visual learning aids
        </h1>

        {state === "empty" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8">
            <p className="text-gray-400 light:text-gray-600">
              No visual learning aids available yet for this subject.
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-red-200 light:bg-white sm:px-8">
            <p className="text-red-400 light:text-red-700">
              Unable to load visual learning aids. Please try again later.
            </p>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-6">
            {visuals.map((visual, index) => (
              <article
                key={`${visual.id}-${visual.chapter_id}-${index}`}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl light:border-gray-200 light:bg-white sm:p-8"
              >
                <h2 className="mb-6 text-xl font-bold text-white light:text-gray-900 sm:text-2xl">
                  {visual.title}
                </h2>
                {visual.type === "flowchart" ? (
                  <Flowchart steps={visual.content.steps ?? []} />
                ) : (
                  <VisualTable
                    headers={visual.content.headers ?? []}
                    rows={visual.content.rows ?? []}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Flowchart({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={`${step}-${index}`}>
          <div className="flex items-start gap-3 rounded-xl border border-blue-800/70 bg-blue-950/40 px-4 py-3 text-blue-50 light:border-blue-200 light:bg-blue-50 light:text-blue-900">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {index + 1}
            </span>
            <span className="min-w-0 break-words leading-relaxed">{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className="flex h-8 items-center justify-center text-2xl leading-none text-blue-400 light:text-blue-600"
              aria-hidden="true"
            >
              ↓
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function VisualTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700 light:border-gray-300">
      <table className="min-w-full divide-y divide-gray-700 text-left text-sm light:divide-gray-300 sm:text-base">
        <thead className="bg-gray-800 light:bg-gray-100">
          <tr>
            {headers.map((header, index) => (
              <th
                key={`${header}-${index}`}
                scope="col"
                className="whitespace-normal px-4 py-3 font-semibold text-gray-100 light:text-gray-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-900 light:divide-gray-200 light:bg-white">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((_, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="break-words px-4 py-3 align-top text-gray-300 light:text-gray-700"
                >
                  {row[cellIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl animate-pulse">
        <div className="mb-8 h-9 w-64 rounded bg-gray-800 light:bg-gray-200" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-8"
            >
              <div className="mb-6 h-7 w-3/5 rounded bg-gray-800 light:bg-gray-200" />
              <div className="space-y-3">
                <div className="h-12 rounded-xl bg-gray-800 light:bg-gray-200" />
                <div className="mx-auto h-5 w-5 rounded bg-gray-800 light:bg-gray-200" />
                <div className="h-12 rounded-xl bg-gray-800 light:bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
