
import { GoogleGenAI } from "@google/genai";
import { DEV_AI_INSTRUCTIONS } from "../constants";

export const generateAIContentStream = async (
  prompt: string, 
  history: { role: string; content: string }[] = [],
  onChunk: (text: string) => void,
  overrideSystemInstruction?: string
) => {
  if (!process.env.API_KEY) {
    throw new Error("Missing AI API Key. System not ready.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: finalInstruction,
        temperature: overrideSystemInstruction ? 0.3 : 0.8,
        thinkingConfig: { thinkingBudget: 0 } 
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
