import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function extractWithGemini(buffer) {
  try {
    const base64Data = buffer.toString("base64");

    const prompt = `Extract all text from this PDF document. Return only the extracted text without any additional commentary or formatting. If the document contains tables, preserve their structure. If the document has multiple pages, extract text from all pages in order.`;

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text?.trim() || "";

    if (text.length > 0) {
      return {
        text,
        success: true,
        method: "gemini-ocr",
      };
    }

    return {
      text: "",
      success: false,
      method: "gemini-ocr",
    };
  } catch (error) {
    console.error("Gemini OCR extraction failed:", error);
    return {
      text: "",
      success: false,
      method: "gemini-ocr",
      error: error.message,
    };
  }
}

export async function extractTextFromPDF(buffer) {
  const geminiResult = await extractWithGemini(buffer);

  if (geminiResult.success) {
    return geminiResult;
  }

  return {
    text: "",
    success: false,
    method: "none",
    error: "Text extraction failed",
  };
}
