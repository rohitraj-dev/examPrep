export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl animate-pulse">
        <header className="mb-10 text-center sm:mb-14">
          <div className="mx-auto mb-4 h-10 max-w-xl rounded-lg bg-gray-800 sm:h-12" />
          <div className="mx-auto h-5 max-w-2xl rounded bg-gray-900" />
        </header>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6"
            >
              <div className="mb-4 h-7 w-3/4 rounded bg-gray-800" />
              <div className="mb-8 h-6 w-1/3 rounded-full bg-gray-800" />
              <div className="h-11 rounded-xl bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
