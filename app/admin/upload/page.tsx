"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
};

export default function UploadPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  
  const [year, setYear] = useState(new Date().getFullYear());
  const [examType, setExamType] = useState("mid-sem");
  const [file, setFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (data) setSubjects(data);
    }
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      let subjectId = selectedSubjectId;

      // 1. Create new subject if necessary
      if (subjectId === "new") {
        if (!newSubjectName) throw new Error("New subject name is required");
        const { data: newSubject, error: subjectError } = await supabase
          .from("subjects")
          .insert({ name: newSubjectName })
          .select()
          .single();
          
        if (subjectError) throw subjectError;
        subjectId = newSubject.id;
        
        // Add to local state so it appears in the list next time
        setSubjects([...subjects, newSubject]);
      }

      // 2. Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${subjectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("papers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("papers")
        .getPublicUrl(filePath);

      // 3. Insert paper record
      const { error: insertError } = await supabase
        .from("papers")
        .insert({
          subject_id: subjectId,
          year,
          exam_type: examType,
          file_url: publicUrlData.publicUrl,
          ocr_status: "pending"
        });

      if (insertError) throw insertError;

      setStatus("success");
      // Reset form
      setFile(null);
      setNewSubjectName("");
      setSelectedSubjectId("");
      
      // Reset file input element if needed (controlled by state but input value is uncontrolled)
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "An error occurred during upload.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Upload Exam Paper</h1>
      
      {status === "success" && (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-6">
          Paper uploaded successfully!
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select 
            value={selectedSubjectId} 
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            required
          >
            <option value="" disabled>Select a subject</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
            <option value="new">+ Create New Subject</option>
          </select>
        </div>

        {selectedSubjectId === "new" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Subject Name</label>
            <input 
              type="text"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full border border-gray-300 rounded p-2"
              required={selectedSubjectId === "new"}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input 
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded p-2"
            min="2000"
            max="2100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
          <select 
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
            required
          >
            <option value="mid-sem">Mid-Sem</option>
            <option value="end-sem">End-Sem</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
          <input 
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 rounded p-2"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={status === "uploading"}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "uploading" ? "Uploading..." : "Upload Paper"}
        </button>
      </form>
    </div>
  );
}
