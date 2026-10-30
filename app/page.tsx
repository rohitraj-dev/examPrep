import { supabase } from "@/lib/supabase";
import SubjectGrid from "@/components/SubjectGrid";

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
          <SubjectGrid subjects={subjects} />
        )}
      </div>
    </main>
  );
}
