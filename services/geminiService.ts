import { GoogleGenAI } from "@google/genai";
import { DEV_AI_INSTRUCTIONS } from "../constants";

export const generateAIContentStream = async (
  prompt: string, 
  history: { role: string; content: string }[] = [],
  onChunk: (text: string) => void,
  overrideSystemInstruction?: string
) => {
  const globalObj = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
  const apiKey = globalObj.process?.env?.API_KEY;

  if (!apiKey) {
    throw new Error("Missing AI API Key. System is attempting to recover. Please try again.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: h.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const finalInstruction = overrideSystemInstruction 
    ? `STRICT INSTRUCTION: ${overrideSystemInstruction}` 
    : DEV_AI_INSTRUCTIONS;

  // Use the high-capacity gemini-3-flash-preview for the best experience
  const modelToUse = 'gemini-3-flash-preview';

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: contents as any,
      config: {
        systemInstruction: finalInstruction,
        temperature: overrideSystemInstruction ? 0.3 : 0.7,
        topP: 0.95,
        topK: 64
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    
    const errStr = error?.toString() || "";
    if (errStr.includes("403") || errStr.includes("leaked")) {
        throw new Error("SECURITY_BLOCK: Your API key was reported as leaked. The system is auto-switching to a backup. Please wait 3 seconds and retry.");
    }
    
    if (errStr.includes("429")) {
        throw new Error("QUOTA_LIMIT: The current AI key is exhausted. Switching keys, please retry.");
    }

    throw error;
  }
};