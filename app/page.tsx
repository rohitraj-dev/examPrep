import { supabase } from "@/lib/supabase";
import SubjectGrid from "@/components/SubjectGrid";

export default async function Home() {
  const [{ data: subjects, error: subjectsError }, { data: papers, error: papersError }] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, code, semester")
        .order("name"),
      supabase
        .from("papers")
        .select("id, subject_id, year, exam_type"),
    ]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center sm:mb-16">
          <h1 className="mb-5 break-words pb-1 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] sm:mb-6 sm:text-5xl lg:text-6xl">
            <span className="text-blue-300 light:text-blue-700">ExamPrep</span>
            <span className="text-gray-100 light:text-gray-900">
              {" — BCA 3rd Semester"}
            </span>
          </h1>
          <p className="mx-auto max-w-xl break-words text-base font-medium leading-7 text-gray-400 light:text-gray-600 sm:text-lg sm:leading-8">
            Your one-stop destination for previous year question papers,
            AI-generated practice questions, and exam preparation resources.
          </p>
        </header>

        {subjectsError || papersError ? (
          <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-4 py-12 text-center shadow-xl light:border-red-200 light:bg-white sm:px-8">
            <h2 className="mb-2 text-xl font-bold text-red-400 light:text-red-700 sm:text-2xl">
              Unable to load subjects
            </h2>
            <p className="text-gray-400 light:text-gray-600">
              We couldn&apos;t load the subjects right now. Please try again
              later.
            </p>
          </div>
        ) : !subjects || subjects.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-12 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8">
            <h2 className="mb-2 text-xl font-bold text-gray-300 light:text-gray-700 sm:text-2xl">
              No subjects found
            </h2>
            <p className="text-gray-400 light:text-gray-600">
              Check back later for new exam preparation resources.
            </p>
          </div>
        ) : (
          <SubjectGrid subjects={subjects} papers={papers ?? []} />
        )}
      </div>
    </main>
  );
}
