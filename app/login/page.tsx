"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setErrorMessage(result.error.message);
      setIsLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-950 px-4 py-10 text-gray-100 sm:px-6 sm:py-14">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-xl light:border-gray-200 light:bg-white light:text-gray-900 sm:p-8">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-extrabold text-blue-300 light:text-blue-700 sm:text-3xl">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-gray-400 light:text-gray-600">
            {isSignUp
              ? "Sign up to keep your ExamPrep account ready."
              : "Sign in to continue to ExamPrep."}
          </p>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2.5 text-sm text-red-300 light:border-red-200 light:bg-red-50 light:text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-gray-300 light:text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 light:border-gray-300 light:bg-gray-50 light:text-gray-900 light:placeholder:text-gray-400 light:focus:border-blue-500 light:focus:ring-blue-500/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-gray-300 light:text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 light:border-gray-300 light:bg-gray-50 light:text-gray-900 light:placeholder:text-gray-400 light:focus:border-blue-500 light:focus:ring-blue-500/20"
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-11 w-full rounded-lg bg-blue-600 px-4 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400/60 light:bg-blue-600 light:hover:bg-blue-700 light:focus:ring-blue-500/60"
          >
            {isLoading
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp((current) => !current);
            setErrorMessage("");
          }}
          className="mt-6 min-h-10 w-full text-sm font-medium text-blue-400 transition-colors hover:text-blue-300 light:text-blue-600 light:hover:text-blue-700"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </main>
  );
}
