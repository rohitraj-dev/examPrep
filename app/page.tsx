import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
};

export default async function Home() {
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, code, semester")
    .order("name");

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center sm:mb-14">
          <h1 className="mb-4 break-words pb-2 text-3xl font-extrabold text-blue-300 sm:text-4xl lg:text-5xl">
            ExamPrep — BCA 3rd Semester
          </h1>
          <p className="mx-auto max-w-2xl break-words text-base text-gray-400 sm:text-lg">
            Your one-stop destination for previous year question papers,
            AI-generated practice questions, and exam preparation resources.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-4 py-12 text-center shadow-xl sm:px-8">
            <h2 className="mb-2 text-xl font-bold text-red-400 sm:text-2xl">
              Unable to load subjects
            </h2>
            <p className="text-gray-400">
              We couldn&apos;t load the subjects right now. Please try again
              later.
            </p>
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-12 text-center shadow-xl sm:px-8">
            <h2 className="mb-2 text-xl font-bold text-gray-300 sm:text-2xl">
              No subjects found
            </h2>
            <p className="text-gray-400">
              Check back later for new exam preparation resources.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(subjects as Subject[]).map((subject) => (
              <div
                key={subject.id}
                className="flex min-w-0 flex-col rounded-2xl border border-gray-800 bg-gray-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gray-700 hover:shadow-2xl sm:p-6"
              >
                <div className="flex-1">
                  <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
                    <h2 className="line-clamp-2 min-w-0 flex-1 break-words text-xl font-bold text-gray-100">
                      {subject.name}
                    </h2>
                    {subject.code && (
                      <span className="shrink-0 rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 font-mono text-xs text-blue-300">
                        {subject.code}
                      </span>
                    )}
                  </div>
                  {subject.semester && (
                    <div className="mb-6 inline-block rounded-full border border-purple-800/50 bg-purple-900/30 px-3 py-1 text-sm text-purple-300">
                      Semester:{" "}
                      <span className="font-semibold">{subject.semester}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/subject/${subject.id}`}
                  className="mt-auto flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-center font-medium text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500"
                >
                  View Papers
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
