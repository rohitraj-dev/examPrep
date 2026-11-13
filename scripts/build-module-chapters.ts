import { readFile } from "node:fs/promises";
import Module from "node:module";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(new Agent({ headersTimeout: 600000, bodyTimeout: 600000 }));

const moduleWithLoader = Module as unknown as {
  _load: (
    request: string,
    parent: unknown,
    isMain: boolean,
  ) => unknown;
};
const originalModuleLoad = moduleWithLoader._load;
moduleWithLoader._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }

  return originalModuleLoad(request, parent, isMain);
};

const SUBJECT_ID = "9725fadd-658f-4c51-b51b-402a6d8998aa";
const EXTRACT_URL = "http://localhost:3000/api/ebook/extract-by-module";
const SPLIT_THRESHOLD = 400000;
const REQUEST_DELAY_MS = 65000;
const CHAPTER_IDS = [
  "fb004f49-e861-434d-a97a-686e41dbbc78",
  "c6587c5d-d02b-4ef7-86ea-dc9de7120967",
  "13e14a6b-654b-4072-8180-4e8a5276faaf",
] as const;

const SYLLABUS_MODULES = [
  {
    module_number: 1,
    title: "OOP Basics & Java Fundamentals",
    topics:
      "Introduction to object-oriented programming, objects and classes, abstraction, encapsulation, inheritance, polymorphism, message passing, benefits and applications of OOP, history and features of Java, Java program structure, tokens, identifiers, keywords, literals, comments, command-line arguments, Java Development Kit (JDK), Java Runtime Environment (JRE), Java Virtual Machine (JVM), compilation and execution of Java programs.",
  },
  {
    module_number: 2,
    title: "Data Types, Control Structures & Arrays",
    topics:
      "Primitive and reference data types, variables, constants, declarations and initialization, type conversion and casting, operators and expressions, arithmetic, relational, logical, assignment, increment and decrement, conditional and bitwise operators, input and output basics, conditional statements including if, if-else, nested if and switch, looping statements including while, do-while and for, break and continue statements, one-dimensional and multidimensional arrays, array declaration, creation, initialization and traversal, and strings.",
  },
  {
    module_number: 3,
    title: "Functions, Classes, Objects & Interfaces",
    topics:
      "Methods and functions, method declaration and invocation, parameters and return values, passing arguments, method overloading, recursion, classes and objects, instance variables and methods, constructors and constructor overloading, this keyword, static members, access modifiers, packages, object creation and use, interfaces, interface declaration and implementation, multiple inheritance through interfaces, and abstract classes and methods.",
  },
  {
    module_number: 4,
    title: "Inheritance & Collections",
    topics:
      "Inheritance and its advantages, single, multilevel and hierarchical inheritance, super keyword, constructor chaining, method overriding, runtime polymorphism, dynamic method dispatch, final classes and methods, abstract classes, Java Collections Framework, generics, collection interfaces, List, Set and Map, ArrayList, LinkedList, HashSet, TreeSet, HashMap and TreeMap, iterators, sorting and searching collections, and common collection operations.",
  },
  {
    module_number: 5,
    title: "Applets & I/O",
    topics:
      "Java applets, applet life cycle, init, start, paint, stop and destroy methods, applet classes and parameters, embedding applets in HTML, graphics and drawing in applets, Java input and output streams, byte streams and character streams, standard input and output, File and file handling, FileInputStream, FileOutputStream, FileReader, FileWriter, BufferedReader, BufferedWriter, input and output buffering, serialization, and exception handling during I/O operations.",
  },
] as const;

type ModuleNumber = (typeof SYLLABUS_MODULES)[number]["module_number"];
type ExtractionResult = Record<`module_${ModuleNumber}`, string>;

function getCookieHeader(cookieFile: string): string {
  const adminSessionCookie = cookieFile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) => line && (!line.startsWith("#") || line.startsWith("#HttpOnly_")),
    )
    .map((line) =>
      line.startsWith("#HttpOnly_") ? line.slice("#HttpOnly_".length) : line,
    )
    .map((line) => line.split("\t"))
    .find((fields) => fields.length >= 7 && fields[5] === "admin_session");

  if (adminSessionCookie) {
    return `${adminSessionCookie[5]}=${adminSessionCookie[6]}`;
  }

  throw new Error(
    "No admin_session cookie found in /tmp/cookie.txt",
  );
}

function isExtractionResult(value: unknown): value is ExtractionResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return SYLLABUS_MODULES.every(
    ({ module_number }) =>
      typeof (value as Record<string, unknown>)[`module_${module_number}`] ===
      "string",
  );
}

async function extractChapter(
  chapterId: string,
  cookieHeader: string,
  content: string,
  pieceNumber: number,
  totalPieces: number,
): Promise<ExtractionResult> {
  console.log(
    `Chapter ${chapterId}: calling piece ${pieceNumber}/${totalPieces}...`,
  );

  try {
    const response = await fetch(EXTRACT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        syllabus_modules: SYLLABUS_MODULES,
        override_content: content,
      }),
    });
    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : `Request failed with status ${response.status}`;
      throw new Error(`Chapter ${chapterId} extraction failed: ${error}`);
    }

    if (!isExtractionResult(data)) {
      throw new Error(`Chapter ${chapterId} returned an invalid extraction`);
    }

    return data;
  } catch (error) {
    console.error("Fetch error:", error, "Cause:", (error as any)?.cause);
    throw error;
  }
}

function splitChapterContent(content: string): string[] {
  const pieces: string[] = [];
  let startIndex = 0;

  for (let pieceNumber = 1; pieceNumber < 4; pieceNumber++) {
    const targetIndex = Math.floor((content.length * pieceNumber) / 4);
    const beforeBoundary = content.lastIndexOf("\n\n", targetIndex);
    const afterBoundary = content.indexOf("\n\n", targetIndex);
    const splitIndex =
      beforeBoundary < startIndex ||
      (afterBoundary !== -1 &&
        targetIndex - beforeBoundary > afterBoundary - targetIndex)
        ? afterBoundary
        : beforeBoundary;

    if (splitIndex === -1) {
      throw new Error("Unable to split chapter content at a paragraph boundary");
    }

    pieces.push(content.slice(startIndex, splitIndex).trim());
    startIndex = splitIndex + 2;
  }

  pieces.push(content.slice(startIndex).trim());
  return pieces;
}

function mergeExtractionResults(
  results: ExtractionResult[],
): ExtractionResult {
  return Object.fromEntries(
    SYLLABUS_MODULES.map(({ module_number }) => {
      const key = `module_${module_number}` as const;
      return [
        key,
        results
          .map((result) => result[key])
          .filter(Boolean)
          .join("\n\n"),
      ];
    }),
  ) as ExtractionResult;
}

async function main() {
  const { supabaseAdmin } = await import("../lib/supabase-admin");
  const cookieFile = await readFile("/tmp/cookie.txt", "utf8");
  const cookieHeader = getCookieHeader(cookieFile);
  const extractedByChapter: ExtractionResult[] = [];

  for (let index = 0; index < CHAPTER_IDS.length; index++) {
    const chapterId = CHAPTER_IDS[index];
    const { data: chapter, error: chapterError } = await supabaseAdmin
      .from("ebook_chapters")
      .select("content")
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter || typeof chapter.content !== "string") {
      throw new Error(
        `Failed to fetch chapter ${chapterId}: ${
          chapterError?.message || "Content not found"
        }`,
      );
    }

    if (chapter.content.length > SPLIT_THRESHOLD) {
      const pieces = splitChapterContent(chapter.content);
      console.log(
        `Chapter ${chapterId} content length ${chapter.content.length}; splitting into ${pieces.length} quarters (${pieces.map((piece) => piece.length).join(", ")} characters).`,
      );
      const pieceResults: ExtractionResult[] = [];

      for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
        if (pieceIndex > 0) {
          console.log("Waiting 65 seconds between split chapter requests...");
          await new Promise((resolve) =>
            setTimeout(resolve, REQUEST_DELAY_MS),
          );
        }

        pieceResults.push(
          await extractChapter(
            chapterId,
            cookieHeader,
            pieces[pieceIndex],
            pieceIndex + 1,
            pieces.length,
          ),
        );
      }

      extractedByChapter.push(mergeExtractionResults(pieceResults));
    } else {
      console.log(
        `Chapter ${chapterId} content length ${chapter.content.length}; processing whole.`,
      );
      extractedByChapter.push(
        await extractChapter(chapterId, cookieHeader, chapter.content, 1, 1),
      );
    }

    if (index < CHAPTER_IDS.length - 1) {
      console.log("Waiting 65 seconds before the next chapter...");
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  const rows = SYLLABUS_MODULES.map((module) => {
    const key = `module_${module.module_number}` as const;
    const content = extractedByChapter
      .map((result) => result[key].trim())
      .filter((text) => text.length > 0)
      .join("\n\n---\n\n");

    console.log(
      `Module ${module.module_number} merged content length: ${content.length}`,
    );

    return {
      subject_id: SUBJECT_ID,
      chapter_title: `Module ${module.module_number}: ${module.title}`,
      content,
      order_index: module.module_number - 1,
      module_scope: key,
    };
  });

  console.log("Inserting 5 module chapters...");
  const { data: insertedChapters, error: insertError } = await supabaseAdmin
    .from("ebook_chapters")
    .insert(rows)
    .select("id");

  if (insertError) {
    throw new Error(`Failed to insert module chapters: ${insertError.message}`);
  }

  const insertedIds = (insertedChapters ?? []).map((chapter) => chapter.id);
  if (insertedIds.length !== rows.length) {
    throw new Error(
      `Expected ${rows.length} inserted chapters but received ${insertedIds.length}`,
    );
  }

  console.log(
    `Successfully inserted ${insertedIds.length} module chapters: ${insertedIds.join(", ")}`,
  );
}

main().catch((error) => {
  console.error(
    "Build module chapters failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
