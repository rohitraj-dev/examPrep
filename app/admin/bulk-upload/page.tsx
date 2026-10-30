"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Subject = {
  id: string;
  name: string;
  code: string | null;
};

type FileStatus =
  | "queued"
  | "processing"
  | "ready"
  | "needs review"
  | "duplicate"
  | "error"
  | "saved";

type QueueItem = {
  id: string; // local uuid
  file: File;
  status: FileStatus;
  error?: string;
  // extracted from Gemini
  ocr_text?: string;
  subject_code?: string;
  subject_name?: string;
  year?: number;
  exam_type?: string;
  file_url?: string;
  // resolved
  subject_id?: string;
  // review overrides
  review_subject_id?: string;
  review_year?: number;
  review_exam_type?: string;
  // ui
  selected: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Match subject_code (e.g. "CN203") against subjects table.
 * Rule: last 3 digits + letter prefix must match.
 *   "CN203" suffix = "203", prefix letter = "CN" -> matches "CN25203" (last 3 = "203", prefix starts with "CN")
 * Fallback: case-insensitive fuzzy substring on subject name.
 */
function matchSubject(
  subjects: Subject[],
  code: string,
  name: string
): string | null {
  const normalizedCode = code?.trim().toUpperCase() ?? "";
  const normalizedName = name?.trim().toLowerCase() ?? "";

  if (normalizedCode) {
    // Extract last 3 digits from the paper code
    const digitsMatch = normalizedCode.match(/(\d{3})$/);
    const letterPrefix = normalizedCode.replace(/\d+$/, ""); // e.g. "CN" from "CN203"

    if (digitsMatch) {
      const last3 = digitsMatch[1];
      for (const sub of subjects) {
        if (!sub.code) continue;
        const dbCode = sub.code.toUpperCase();
        const dbDigitsMatch = dbCode.match(/(\d{3})$/);
        const dbLetterPrefix = dbCode.replace(/\d+$/, "");
        if (
          dbDigitsMatch &&
          dbDigitsMatch[1] === last3 &&
          dbLetterPrefix.startsWith(letterPrefix)
        ) {
          return sub.id;
        }
      }
    }
  }

  // Fallback: fuzzy name match
  if (normalizedName) {
    const words = normalizedName.split(/\s+/).filter((w) => w.length > 3);
    let bestScore = 0;
    let bestId: string | null = null;
    for (const sub of subjects) {
      const subName = sub.name.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (subName.includes(word)) score++;
      }
      if (score > 0 && score > bestScore) {
        bestScore = score;
        bestId = sub.id;
      }
    }
    // Only confident if score > 0 (at least one keyword matched)
    if (bestId && bestScore >= 2) return bestId;
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("subjects")
      .select("id, name, code")
      .order("name")
      .then(({ data }) => {
        if (data) setSubjects(data as Subject[]);
      });
  }, []);

  // ── Add files to queue ────────────────────────────────────────────────────

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
    );
    if (!arr.length) return;
    setQueue((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: uid(),
        file: f,
        status: "queued" as FileStatus,
        selected: true,
      })),
    ]);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  // ── Process loop ──────────────────────────────────────────────────────────

  const updateItem = useCallback(
    (id: string, patch: Partial<QueueItem>) =>
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      ),
    []
  );

  const processFile = useCallback(
    async (item: QueueItem, subjectsList: Subject[]) => {
      updateItem(item.id, { status: "processing", error: undefined });

      // 1. Upload to storage: papers/unsorted/{random}_{timestamp}.pdf
      const rand = Math.random().toString(36).slice(2, 10);
      const filePath = `unsorted/${rand}_${Date.now()}.pdf`;
      const signedUploadRes = await fetch("/api/admin/signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath }),
      });
      const signedUploadData = await signedUploadRes.json().catch(() => null);

      if (!signedUploadRes.ok) {
        updateItem(item.id, {
          status: "error",
          error: `Upload failed: ${signedUploadData?.error ?? "Failed to create signed upload URL"}`,
        });
        return;
      }

      const { path, token } = signedUploadData;
      const { error: uploadErr } = await supabase.storage
        .from("papers")
        .uploadToSignedUrl(path, token, item.file);

      if (uploadErr) {
        updateItem(item.id, {
          status: "error",
          error: `Upload failed: ${uploadErr.message}`,
        });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("papers")
        .getPublicUrl(filePath);

      const file_url = publicUrlData.publicUrl;

      // 2. Call /api/bulk/process with retry on 429/5xx
      let result: {
        success: boolean;
        ocr_text?: string;
        subject_code?: string;
        subject_name?: string;
        year?: number;
        exam_type?: string;
        error?: string;
      } | null = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await delay(5000);
        const res = await fetch("/api/bulk/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url }),
        });
        if (!res.ok && (res.status === 429 || res.status >= 500)) {
          if (attempt < 2) continue;
          const body = await res.json().catch(() => ({}));
          updateItem(item.id, {
            status: "error",
            error: body.error ?? `Server error ${res.status}`,
            file_url,
          });
          return;
        }
        result = await res.json();
        break;
      }

      if (!result || !result.success) {
        updateItem(item.id, {
          status: "error",
          error: result?.error ?? "Unknown error from process API",
          file_url,
        });
        return;
      }

      const { ocr_text, subject_code, subject_name, year, exam_type } = result;

      // 3. Match subject
      const matched_subject_id = matchSubject(
        subjectsList,
        subject_code ?? "",
        subject_name ?? ""
      );

      // 4. Check duplicate
      let isDuplicate = false;
      if (matched_subject_id && year && exam_type) {
        const { data: dupData } = await supabase
          .from("papers")
          .select("id")
          .eq("subject_id", matched_subject_id)
          .eq("year", year)
          .eq("exam_type", exam_type)
          .limit(1);
        isDuplicate = !!(dupData && dupData.length > 0);
      }

      const status: FileStatus = isDuplicate
        ? "duplicate"
        : matched_subject_id
        ? "ready"
        : "needs review";

      updateItem(item.id, {
        status,
        ocr_text,
        subject_code,
        subject_name,
        year,
        exam_type,
        file_url,
        subject_id: matched_subject_id ?? undefined,
        review_subject_id: matched_subject_id ?? undefined,
        review_year: year,
        review_exam_type: exam_type ?? "mid-sem",
        // duplicates unchecked by default
        selected: !isDuplicate,
      });
    },
    [updateItem]
  );

  const startProcessing = useCallback(async () => {
    setProcessing(true);
    const toProcess = queue.filter((i) => i.status === "queued");
    // Snapshot subjects at start
    const { data: latestSubjects } = await supabase
      .from("subjects")
      .select("id, name, code")
      .order("name");
    const subList = (latestSubjects as Subject[]) ?? subjects;
    setSubjects(subList);

    for (let i = 0; i < toProcess.length; i++) {
      if (i > 0) await delay(4000);
      await processFile(toProcess[i], subList);
    }
    setProcessing(false);
  }, [queue, subjects, processFile]);

  // ── Save selected ─────────────────────────────────────────────────────────

  const saveSelected = useCallback(async () => {
    const toSave = queue.filter(
      (i) =>
        i.selected &&
        (i.status === "ready" ||
          i.status === "needs review" ||
          i.status === "duplicate")
    );

    let count = 0;
    for (const item of toSave) {
      const subject_id = item.review_subject_id ?? item.subject_id;
      const year = item.review_year ?? item.year;
      const exam_type = item.review_exam_type ?? item.exam_type ?? "mid-sem";

      if (!subject_id || !year || !item.file_url) {
        updateItem(item.id, {
          status: "error",
          error: "Missing subject, year, or file_url — cannot save",
        });
        continue;
      }

      const paperRes = await fetch("/api/admin/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id,
          year,
          exam_type,
          file_url: item.file_url,
          ocr_text: item.ocr_text ?? null,
          ocr_status: "done",
        }),
      });
      const paperData = await paperRes.json().catch(() => null);

      if (!paperRes.ok) {
        updateItem(item.id, {
          status: "error",
          error: `DB insert failed: ${paperData?.error ?? "Failed to insert paper"}`,
        });
      } else {
        updateItem(item.id, { status: "saved", selected: false });
        count++;
      }
    }
    setSavedCount((prev) => prev + count);
  }, [queue, updateItem]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasQueued = queue.some((i) => i.status === "queued");
  const hasReviewable = queue.some(
    (i) =>
      i.selected &&
      (i.status === "ready" ||
        i.status === "needs review" ||
        i.status === "duplicate")
  );

  const statusBadge: Record<FileStatus, string> = {
    queued: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    "needs review": "bg-yellow-100 text-yellow-800",
    duplicate: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
    saved: "bg-purple-100 text-purple-700",
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Upload</h1>
          <a
            href="/admin/upload"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Single upload
          </a>
        </div>
        <div className="flex items-center gap-3">
          {savedCount > 0 && (
            <div className="bg-green-100 text-green-700 text-sm px-4 py-2 rounded">
              ✓ {savedCount} paper{savedCount !== 1 ? "s" : ""} saved
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors mb-6 ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <p className="text-gray-600">
          Drop PDF files here, or{" "}
          <span className="text-blue-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Multiple PDFs supported</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {/* Actions */}
      {queue.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={startProcessing}
            disabled={processing || !hasQueued}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {processing ? "Processing…" : `Process ${queue.filter((i) => i.status === "queued").length} queued`}
          </button>
          <button
            onClick={saveSelected}
            disabled={!hasReviewable}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Save selected
          </button>
          <button
            onClick={() =>
              setQueue((prev) => prev.filter((i) => i.status !== "saved"))
            }
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear saved
          </button>
        </div>
      )}

      {/* Queue table */}
      {queue.length > 0 && (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      queue
                        .filter((i) =>
                          ["ready", "needs review", "duplicate"].includes(
                            i.status
                          )
                        )
                        .every((i) => i.selected)
                    }
                    onChange={(e) =>
                      setQueue((prev) =>
                        prev.map((i) =>
                          ["ready", "needs review", "duplicate"].includes(
                            i.status
                          )
                            ? { ...i, selected: e.target.checked }
                            : i
                        )
                      )
                    }
                  />
                </th>
                <th className="px-3 py-2 text-left">File</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Year</th>
                <th className="px-3 py-2 text-left">Exam type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((item) => (
                <tr
                  key={item.id}
                  className={item.status === "saved" ? "opacity-50" : ""}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2">
                    {["ready", "needs review", "duplicate"].includes(
                      item.status
                    ) && (
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) =>
                          updateItem(item.id, { selected: e.target.checked })
                        }
                      />
                    )}
                  </td>

                  {/* Filename */}
                  <td className="px-3 py-2 max-w-[200px] truncate text-gray-700">
                    {item.file.name}
                  </td>

                  {/* Status badge */}
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge[item.status]}`}
                    >
                      {item.status}
                    </span>
                    {item.status === "error" && item.error && (
                      <p className="text-xs text-red-600 mt-1 max-w-[200px]">
                        {item.error}
                      </p>
                    )}
                    {item.status === "processing" && (
                      <span className="ml-2 text-xs text-blue-500 animate-pulse">
                        …
                      </span>
                    )}
                  </td>

                  {/* Subject dropdown (editable for review-able statuses) */}
                  <td className="px-3 py-2 min-w-[180px]">
                    {["ready", "needs review", "duplicate"].includes(
                      item.status
                    ) ? (
                      <select
                        value={item.review_subject_id ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            review_subject_id: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="">-- select subject --</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code ? `${s.code} – ` : ""}
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        {item.subject_name ?? "—"}
                      </span>
                    )}
                  </td>

                  {/* Year input */}
                  <td className="px-3 py-2 w-24">
                    {["ready", "needs review", "duplicate"].includes(
                      item.status
                    ) ? (
                      <input
                        type="number"
                        value={item.review_year ?? ""}
                        min={2000}
                        max={2100}
                        onChange={(e) =>
                          updateItem(item.id, {
                            review_year: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">
                        {item.year ?? "—"}
                      </span>
                    )}
                  </td>

                  {/* Exam type dropdown */}
                  <td className="px-3 py-2 w-32">
                    {["ready", "needs review", "duplicate"].includes(
                      item.status
                    ) ? (
                      <select
                        value={item.review_exam_type ?? "mid-sem"}
                        onChange={(e) =>
                          updateItem(item.id, {
                            review_exam_type: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="mid-sem">Mid-Sem</option>
                        <option value="end-sem">End-Sem</option>
                      </select>
                    ) : (
                      <span className="text-gray-500 text-xs">
                        {item.exam_type ?? "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {queue.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-10">
          No files added yet.
        </p>
      )}
    </div>
  );
}
