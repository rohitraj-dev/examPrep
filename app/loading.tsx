export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl animate-pulse">
        <header className="mb-10 text-center sm:mb-14">
          <div className="mx-auto mb-4 h-10 max-w-xl rounded-lg bg-gray-800 light:bg-gray-200 sm:h-12" />
          <div className="mx-auto h-5 max-w-2xl rounded bg-gray-900 light:bg-gray-100" />
        </header>
        <div className="mb-6 h-11 rounded-xl border border-gray-700 bg-gray-900 light:border-gray-300 light:bg-gray-100" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-52 flex-col rounded-2xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-6"
            >
              <div className="mb-4 h-7 w-3/4 rounded bg-gray-800 light:bg-gray-200" />
              <div className="mb-8 h-6 w-1/3 rounded-full bg-gray-800 light:bg-gray-200" />
              <div className="mt-auto h-11 rounded-xl bg-gray-800 light:bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="mt-10 h-8 w-32 rounded bg-gray-800 light:bg-gray-200" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 light:border-gray-200 light:bg-white sm:p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-800 light:bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-800 light:bg-gray-200" />
              </div>
              <div className="h-7 w-16 rounded bg-gray-800 light:bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
