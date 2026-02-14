
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
    throw new Error("Missing AI API Key. Please add one in the Admin Panel.");
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

  // Use Flash for standard tasks to avoid Quota 429 errors, use Pro for complex tool requests
  const modelToUse = (prompt.toLowerCase().includes('complex') || prompt.toLowerCase().includes('generate complete app')) 
    ? 'gemini-3-pro-preview' 
    : 'gemini-3-flash-preview';

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: contents as any,
      config: {
        systemInstruction: finalInstruction,
        temperature: overrideSystemInstruction ? 0.3 : 0.8,
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
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};
