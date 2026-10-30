"use client";

import { usePathname } from "next/navigation";
import InstallHint from "@/components/InstallHint";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-4 py-8 text-center text-sm text-gray-400 sm:px-6">
      <p>
        Missing a paper or found a problem?{" "}
        <a
          href="https://forms.gle/cL7FhSVQXziHkPPT8"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-400 underline decoration-blue-400/50 underline-offset-4 transition-colors hover:text-blue-300"
        >
          Report a problem / Request a paper
        </a>
      </p>
      <InstallHint />
    </footer>
  );
}
