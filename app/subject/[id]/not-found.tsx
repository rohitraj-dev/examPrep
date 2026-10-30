import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-12 text-center shadow-xl sm:px-8">
          <h1 className="mb-3 text-2xl font-bold text-gray-100 sm:text-3xl">
            Subject not found
          </h1>
          <p className="mb-6 text-gray-400">
            The subject you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500"
          >
            ← Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
