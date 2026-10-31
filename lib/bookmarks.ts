export const BOOKMARKS_STORAGE_KEY = "bookmarked_papers";

export type BookmarkedPaper = {
  id: string;
  subject_id: string;
  subject_name: string;
  year: number;
  exam_type: string;
  file_url: string;
};

function isBookmarkedPaper(value: unknown): value is BookmarkedPaper {
  if (!value || typeof value !== "object") return false;

  const paper = value as Partial<BookmarkedPaper>;
  return (
    typeof paper.id === "string" &&
    typeof paper.subject_id === "string" &&
    typeof paper.subject_name === "string" &&
    typeof paper.year === "number" &&
    typeof paper.exam_type === "string" &&
    typeof paper.file_url === "string"
  );
}

export function getBookmarks(): BookmarkedPaper[] {
  if (typeof window === "undefined") return [];

  const storedBookmarks = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
  if (!storedBookmarks) return [];

  try {
    const parsedBookmarks: unknown = JSON.parse(storedBookmarks);
    return Array.isArray(parsedBookmarks)
      ? parsedBookmarks.filter(isBookmarkedPaper)
      : [];
  } catch {
    return [];
  }
}

export function isBookmarked(paperId: string): boolean {
  return getBookmarks().some((paper) => paper.id === paperId);
}

export function toggleBookmark(
  paper: BookmarkedPaper,
): BookmarkedPaper[] {
  const bookmarks = getBookmarks();
  const nextBookmarks = bookmarks.some((bookmark) => bookmark.id === paper.id)
    ? bookmarks.filter((bookmark) => bookmark.id !== paper.id)
    : [...bookmarks, paper];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify(nextBookmarks),
    );
  }

  return nextBookmarks;
}
