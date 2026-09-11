"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
};

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, code, semester")
          .order("name");
          
        if (error) {
          console.error("Error fetching subjects:", error);
        } else if (data) {
          setSubjects(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubjects();
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 pb-2">
            ExamPrep — BCA 3rd Semester
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your one-stop destination for previous year question papers, AI-generated practice questions, and exam preparation resources.
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-400 mb-4"></div>
            <span className="text-gray-400 text-lg animate-pulse">Loading subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No subjects found</h2>
            <p className="text-gray-500">Check back later or add subjects via the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col hover:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h2 className="text-xl font-bold text-gray-100 line-clamp-2">
                      {subject.name}
                    </h2>
                    {subject.code && (
                      <span className="bg-gray-800 text-blue-300 text-xs font-mono px-2.5 py-1 rounded-md whitespace-nowrap border border-gray-700">
                        {subject.code}
                      </span>
                    )}
                  </div>
                  {subject.semester && (
                    <div className="inline-block bg-purple-900/30 text-purple-300 text-sm px-3 py-1 rounded-full mb-6 border border-purple-800/50">
                      Semester: <span className="font-semibold">{subject.semester}</span>
                    </div>
                  )}
                </div>
                
                <Link 
                  href={`/subject/${subject.id}`}
                  className="mt-auto w-full block text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                >
                  View Papers
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
