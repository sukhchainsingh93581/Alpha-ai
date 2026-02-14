
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
    throw new Error("Initializing AI Engine... Please wait.");
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

  // Use Flash for high reliability and lower quota pressure
  const modelToUse = 'gemini-3-flash-preview';

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: contents as any,
      config: {
        systemInstruction: finalInstruction,
        temperature: overrideSystemInstruction ? 0.3 : 0.7,
        topP: 0.95,
        topK: 40
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
    console.error("AI Stream Failure:", error);
    
    const errStr = error?.toString() || "";
    if (errStr.includes("403") || errStr.includes("leaked")) {
        throw new Error("CONNECTION_BLOCK: Key marked as leaked. The system is re-initializing. Please try sending again.");
    }
    
    if (errStr.includes("429")) {
        throw new Error("QUOTA_FULL: Please wait a few seconds before sending the next message.");
    }

    throw error;
  }
};
