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
    throw new Error("AI Engine initializing...");
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

  // Using gemini-3-flash-preview for high capacity and stability
  const modelToUse = 'gemini-3-flash-preview';

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: contents as any,
      config: {
        systemInstruction: finalInstruction,
        temperature: 0.7,
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
    console.error("AI Generation Error:", error);
    const msg = error?.message || error?.toString() || "Unknown AI error";
    throw new Error(msg);
  }
};