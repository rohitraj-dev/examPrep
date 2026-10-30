"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

export default function InstallHint() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );

    setIsMobile(mediaQuery.matches);
    setIsIos(isIosDevice());
    setIsDismissed(
      standalone || window.localStorage.getItem("examprep-install-dismissed") === "true",
    );

    const handleMediaChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem("examprep-install-dismissed", "true");
    setIsDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === "accepted") {
      dismiss();
    }
  };

  if (
    !isMobile ||
    isDismissed ||
    (!isIos && !installPrompt)
  ) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-blue-900/60 bg-blue-950/30 p-4 text-left sm:flex-row sm:justify-between">
      <p className="text-sm text-gray-300">
        {isIos ? "Tap Share → Add to Home Screen" : "Install ExamPrep for quick access."}
      </p>
      <div className="flex shrink-0 items-center gap-3">
        {!isIos && (
          <button
            type="button"
            onClick={install}
            className="min-h-10 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
          >
            Install app
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install app hint"
          className="min-h-10 rounded-lg px-2 py-2 text-gray-400 transition-colors hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
