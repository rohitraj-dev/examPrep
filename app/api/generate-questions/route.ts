import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subjectId = body.subject_id;

    if (!subjectId) {
      return NextResponse.json({ success: false, error: "Missing subject_id in request body" }, { status: 400 });
    }

    // 1. Fetch all papers for that subject from Supabase
    const { data: papers, error: fetchError } = await supabase
      .from('papers')
      .select('ocr_text')
      .eq('subject_id', subjectId)
      .eq('ocr_status', 'done');

    if (fetchError) {
      throw new Error(`Failed to fetch papers: ${fetchError.message}`);
    }

    if (!papers || papers.length === 0) {
      return NextResponse.json({ success: false, error: "No processed papers found for this subject" }, { status: 404 });
    }

    // 2. Combine all ocr_text into one string
    const combinedOcrText = papers
      .map(p => p.ocr_text)
      .filter(Boolean)
      .join('\n\n--- NEXT PAPER ---\n\n');
      
    if (!combinedOcrText.trim()) {
      return NextResponse.json({ success: false, error: "Extracted text from papers is empty" }, { status: 400 });
    }

    // 3. Send to Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const promptText = `Based on these previous year exam papers, generate 10 most probable exam questions. Return ONLY a JSON array of objects with fields: question (string) and confidence (number between 0 and 1). No markdown, no extra text.\n\nExam Papers:\n${combinedOcrText}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
            }
          ]
        }
      ]
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    
    // 4. Parse the JSON array from Gemini response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Failed to extract text from Gemini response");
    }

    let parsedQuestions: Array<{ question: string, confidence: number }>;
    try {
      parsedQuestions = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText);
      throw new Error("Gemini returned invalid JSON format");
    }

    if (!Array.isArray(parsedQuestions)) {
      throw new Error("Gemini did not return an array");
    }

    // 5. Delete existing ai_questions rows for this subject_id
    const { error: deleteError } = await supabase
      .from('ai_questions')
      .delete()
      .eq('subject_id', subjectId);

    if (deleteError) {
      throw new Error(`Failed to delete existing questions: ${deleteError.message}`);
    }

    // 6. Insert new rows into ai_questions table
    const rowsToInsert = parsedQuestions.map(q => ({
      subject_id: subjectId,
      question: q.question,
      confidence: q.confidence,
      generated_at: new Date().toISOString()
    }));

    // If there are no questions parsed for some reason, return early
    if (rowsToInsert.length === 0) {
       return NextResponse.json({ success: true, count: 0 });
    }

    const { error: insertError } = await supabase
      .from('ai_questions')
      .insert(rowsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert new questions: ${insertError.message}`);
    }

    // 7. Return success and count
    return NextResponse.json({ success: true, count: rowsToInsert.length });

  } catch (error: any) {
    console.error("Generate Questions API Error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
