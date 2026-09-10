import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  let paperId: string | undefined;

  try {
    const body = await request.json();
    paperId = body.paper_id;

    if (!paperId) {
      return NextResponse.json({ success: false, error: "Missing paper_id in request body" }, { status: 400 });
    }

    // 1. Fetch the paper row from Supabase
    const { data: paper, error: fetchError } = await supabase
      .from('papers')
      .select('id, file_url, ocr_status')
      .eq('id', paperId)
      .single();

    if (fetchError || !paper) {
      throw new Error(`Failed to fetch paper: ${fetchError?.message || 'Not found'}`);
    }

    if (!paper.file_url) {
      throw new Error("Paper has no file_url");
    }

    // 2. Download the PDF file using the public URL
    const pdfResponse = await fetch(paper.file_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }
    
    // 3. Convert PDF to base64
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Data = Buffer.from(pdfBuffer).toString('base64');

    // 4. Send to Gemini Flash API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const geminiBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: "application/pdf",
                data: base64Data
              }
            },
            {
              text: "Extract all text from this exam paper. Return plain text only."
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
    
    // 5. Extract text from Gemini response
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!extractedText) {
      throw new Error("Failed to extract text from Gemini response");
    }

    // 6. Update papers row to success
    const { error: updateError } = await supabase
      .from('papers')
      .update({
        ocr_text: extractedText,
        ocr_status: 'done'
      })
      .eq('id', paperId);

    if (updateError) {
      throw new Error(`Failed to update paper in database: ${updateError.message}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OCR API Error:", error);

    // On any error, set status to failed if we know the paperId
    if (paperId) {
      await supabase
        .from('papers')
        .update({ ocr_status: 'failed' })
        .eq('id', paperId);
    }

    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
