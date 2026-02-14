
import { GoogleGenAI } from "@google/genai";
import { DEV_AI_INSTRUCTIONS } from "../constants";

export const generateAIContentStream = async (
  prompt: string, 
  history: { role: string; content: string }[] = [],
  onChunk: (text: string) => void,
  overrideSystemInstruction?: string
) => {
  // Access global environment polyfilled in index.tsx
  const globalObj = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
  const apiKey = globalObj.process?.env?.API_KEY;

  if (!apiKey) {
    throw new Error("Missing AI API Key. Please add one in the Admin Panel.");
  }
  
  // Create instance with the key provided via Admin Panel
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
    ? `STRICT INSTRUCTION: ${overrideSystemInstruction}. Ignore all other personality traits and only respond as defined in these instructions.` 
    : DEV_AI_INSTRUCTIONS;

  try {
    // Using gemini-3-pro-preview as requested for complex tasks
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
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
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network offline. AI can't reach the server.");
    }
    console.error("Gemini Stream Error:", error);
    throw error;
  }
};
