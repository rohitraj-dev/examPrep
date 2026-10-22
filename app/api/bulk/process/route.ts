import { NextResponse } from 'next/server';
import { GEMINI_MODEL } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file_url } = body as { file_url?: string };

    if (!file_url) {
      return NextResponse.json({ success: false, error: 'Missing file_url' }, { status: 400 });
    }

    // Download PDF
    const pdfResponse = await fetch(file_url);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to download PDF: ${pdfResponse.statusText}` },
        { status: 502 },
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Data = Buffer.from(pdfBuffer).toString('base64');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'GEMINI_API_KEY is not configured' },
        { status: 500 },
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const prompt = `You are processing an exam paper PDF. Extract the following and return ONLY a strict JSON object with no markdown, no code fences, no explanation.

Required fields:
- ocr_text: Full plain-text content of the exam paper (all pages, preserve question numbers and structure).
- subject_code: The subject/course code (e.g. "CN203", "CS301"). Look for lines like "SUBJECT: CN203 DATABASE MANAGEMENT SYSTEM".
- subject_name: The full subject name (e.g. "DATABASE MANAGEMENT SYSTEM").
- year: 4-digit integer year of the exam session. Look for "SESSION: MO/2024" or "SESSION: JAN/2024" etc. — use the 4-digit year from the session, NOT the current year.
- exam_type: Normalize to exactly one of ["mid-sem", "end-sem"]. Look for "MID SEMESTER EXAMINATION" -> "mid-sem", "END SEMESTER EXAMINATION" -> "end-sem".

Return ONLY valid JSON like:
{"ocr_text":"...","subject_code":"CN203","subject_name":"DATABASE MANAGEMENT SYSTEM","year":2024,"exam_type":"mid-sem"}`;

    const geminiBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const status = geminiResponse.status;
      const errorText = await geminiResponse.text();
      return NextResponse.json(
        { success: false, error: `Gemini API error ${status}: ${errorText}` },
        { status },
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Strip code fences if present
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: {
      ocr_text: string;
      subject_code: string;
      subject_name: string;
      year: number;
      exam_type: string;
    };

    try {
      parsed = JSON.parse(stripped);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Gemini returned non-JSON output', raw: rawText },
        { status: 422 },
      );
    }

    // Normalize exam_type
    const et = (parsed.exam_type ?? '').toLowerCase();
    if (et.includes('end')) {
      parsed.exam_type = 'end-sem';
    } else {
      parsed.exam_type = 'mid-sem';
    }

    // Ensure year is a number
    parsed.year = parseInt(String(parsed.year), 10);

    return NextResponse.json({ success: true, ...parsed });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unexpected error';
    console.error('bulk/process error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
