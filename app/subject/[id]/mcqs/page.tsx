"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type MCQ = {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  chapter_id: string;
};

type QuizState = "loading" | "ready" | "empty" | "error" | "finished";

export default function MCQsPage() {
  const { id } = useParams<{ id: string }>();
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [state, setState] = useState<QuizState>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuestions() {
      setState("loading");

      try {
        const response = await fetch(
          `/api/ebook/mcqs?subject_id=${encodeURIComponent(id)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to load practice questions");
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid practice question response");
        }

        const nextQuestions = data as MCQ[];
        setQuestions(nextQuestions);
        setState(nextQuestions.length > 0 ? "ready" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setState("error");
      }
    }

    void loadQuestions();

    return () => controller.abort();
  }, [id]);

  function selectAnswer(answer: string) {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);
    if (answer === questions[currentIndex].correct_answer) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function advance() {
    if (currentIndex === questions.length - 1) {
      setState("finished");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedAnswer(null);
  }

  function restart() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setState("ready");
  }

  if (state === "loading") {
    return <LoadingState />;
  }

  if (state === "empty") {
    return (
      <PageShell>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8">
          <h1 className="mb-3 text-2xl font-bold text-white light:text-gray-900">
            No practice questions yet
          </h1>
          <p className="mx-auto mb-7 max-w-md text-gray-400 light:text-gray-600">
            No practice questions available yet for this subject.
          </p>
          <BackLink id={id} />
        </div>
      </PageShell>
    );
  }

  if (state === "error") {
    return (
      <PageShell>
        <div className="rounded-2xl border border-red-900/60 bg-gray-900 px-5 py-12 text-center shadow-xl light:border-red-200 light:bg-white sm:px-8">
          <h1 className="mb-3 text-2xl font-bold text-red-400 light:text-red-700">
            Unable to load practice questions
          </h1>
          <p className="mx-auto mb-7 max-w-md text-gray-400 light:text-gray-600">
            Please try again later.
          </p>
          <BackLink id={id} />
        </div>
      </PageShell>
    );
  }

  if (state === "finished") {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <PageShell>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 px-5 py-10 text-center shadow-xl light:border-gray-200 light:bg-white sm:px-8 sm:py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Practice complete
          </p>
          <h1 className="mb-8 text-3xl font-bold text-white light:text-gray-900 sm:text-4xl">
            Your results
          </h1>
          <div className="mb-8">
            <p className="text-5xl font-extrabold text-blue-400 sm:text-6xl">
              {score} <span className="text-2xl font-semibold text-gray-500 sm:text-3xl">/ {questions.length}</span>
            </p>
            <p className="mt-3 text-gray-400 light:text-gray-600">
              You scored {percentage}%
            </p>
          </div>
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            Restart
          </button>
        </div>
      </PageShell>
    );
  }

  const question = questions[currentIndex];
  const answered = selectedAnswer !== null;

  return (
    <PageShell>
      <div className="mb-6">
        <BackLink id={id} />
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-blue-400">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <p className="text-sm text-gray-400 light:text-gray-600">
          Score: <span className="font-semibold text-gray-200 light:text-gray-900">{score}</span>
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800 light:bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <section className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl light:border-gray-200 light:bg-white sm:p-8">
        <h1 className="mb-8 text-xl font-bold leading-relaxed text-white light:text-gray-900 sm:text-2xl">
          {question.question}
        </h1>

        <div className="space-y-3">
          {question.options.map((option, optionIndex) => {
            const isCorrect = option === question.correct_answer;
            const isSelected = option === selectedAnswer;
            const optionState = answered
              ? isCorrect
                ? "correct"
                : isSelected
                  ? "wrong"
                  : "idle"
              : "idle";

            return (
              <button
                key={`${question.id}-${optionIndex}`}
                type="button"
                disabled={answered}
                onClick={() => selectAnswer(option)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                  optionState === "correct"
                    ? "border-green-700 bg-green-950/60 text-green-200 light:border-green-300 light:bg-green-50 light:text-green-800"
                    : optionState === "wrong"
                      ? "border-red-700 bg-red-950/60 text-red-200 light:border-red-300 light:bg-red-50 light:text-red-800"
                      : "border-gray-700 bg-gray-950 text-gray-200 hover:border-blue-500 hover:bg-gray-800 light:border-gray-300 light:bg-gray-50 light:text-gray-800 light:hover:border-blue-500 light:hover:bg-gray-100"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-sm font-semibold">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="min-w-0 break-words">{option}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={advance}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:w-auto"
            >
              {currentIndex === questions.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 text-gray-100 light:bg-white light:text-gray-900 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </main>
  );
}

function BackLink({ id }: { id: string }) {
  return (
    <Link
      href={`/subject/${id}`}
      className="inline-flex min-h-11 items-center px-1 py-2 text-base font-medium text-blue-400 transition-colors hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
    >
      ← Back to subject
    </Link>
  );
}

function LoadingState() {
  return (
    <PageShell>
      <div className="animate-pulse">
        <div className="mb-6 h-11 w-36 rounded bg-gray-800 light:bg-gray-200" />
        <div className="mb-5 flex justify-between gap-4">
          <div className="h-5 w-36 rounded bg-gray-800 light:bg-gray-200" />
          <div className="h-5 w-20 rounded bg-gray-800 light:bg-gray-200" />
        </div>
        <div className="mb-6 h-1.5 rounded-full bg-gray-800 light:bg-gray-200" />
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 light:border-gray-200 light:bg-white sm:p-8">
          <div className="mb-8 space-y-3">
            <div className="h-6 w-full rounded bg-gray-800 light:bg-gray-200" />
            <div className="h-6 w-4/5 rounded bg-gray-800 light:bg-gray-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-12 rounded-xl bg-gray-800 light:bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
