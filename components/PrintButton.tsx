"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Print or save AI questions as a PDF"
      className="min-h-11 rounded-xl bg-blue-600 light:bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-500 light:hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:focus:ring-blue-500/60 sm:px-5 sm:text-base"
    >
      Print / Save as PDF
    </button>
  );
}
