export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-6 h-11 w-24 rounded bg-gray-800 light:bg-gray-200" />
        <header className="mb-10 border-b border-gray-800 pb-6 light:border-gray-200 sm:mb-12 sm:pb-8">
          <div className="mb-4 h-10 w-2/3 rounded bg-gray-800 light:bg-gray-200 sm:h-12" />
          <div className="h-5 w-32 rounded bg-gray-900 light:bg-gray-100" />
        </header>
        <section className="mb-12 sm:mb-16">
          <div className="mb-6 h-8 w-64 rounded bg-gray-800 light:bg-gray-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-56 flex-col rounded-xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-6"
              >
                <div className="mb-3 h-7 w-2/3 rounded bg-gray-800 light:bg-gray-200" />
                <div className="mb-6 h-8 w-2/3 rounded-lg bg-gray-800 light:bg-gray-200" />
                <div className="mt-auto h-11 rounded-lg bg-gray-800 light:bg-gray-200" />
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-6 h-8 w-72 rounded bg-gray-800 light:bg-gray-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-56 flex-col rounded-xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-6"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-7 w-1/3 rounded bg-gray-800 light:bg-gray-200" />
                  <div className="h-10 w-10 rounded-lg bg-gray-800 light:bg-gray-200" />
                </div>
                <div className="mb-6 h-8 w-2/3 rounded-lg bg-gray-800 light:bg-gray-200" />
                <div className="mt-auto h-11 rounded-lg bg-gray-800 light:bg-gray-200" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
