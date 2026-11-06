"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type Status = "idle" | "loading" | "success" | "error";

export default function EbookUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startingOrderIndex, setStartingOrderIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, code")
        .order("name");

      if (data) setSubjects(data as Subject[]);
    }

    fetchSubjects();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubjectId || !file) return;

    setStatus("loading");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("subject_id", selectedSubjectId);
      formData.append("file", file);
      formData.append(
        "starting_order_index",
        String(startingOrderIndex),
      );

      const response = await fetch("/api/ebook/process", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to process ebook.");
      }

      setStatus("success");
      setMessage(`Done! ${data.count} chapters inserted.`);
      setSelectedSubjectId("");
      setFile(null);
      setStartingOrderIndex(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-900 dark:bg-neutral-950 dark:text-neutral-100 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Ebook
          </h1>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Logout
          </button>
        </div>

        {status === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <label
              htmlFor="subject"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
            >
              Subject
            </label>
            <select
              id="subject"
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              required
            >
              <option value="" disabled>
                Select a subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.code} - ` : ""}
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ebook-file"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
            >
              PDF File
            </label>
            <input
              ref={fileInputRef}
              id="ebook-file"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="starting-order-index"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
            >
              Starting order index
            </label>
            <input
              id="starting-order-index"
              type="number"
              min="0"
              step="1"
              value={startingOrderIndex}
              onChange={(event) =>
                setStartingOrderIndex(Number(event.target.value))
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? "Processing ebook..." : "Process Ebook"}
          </button>
        </form>
      </div>
    </div>
  );
}
