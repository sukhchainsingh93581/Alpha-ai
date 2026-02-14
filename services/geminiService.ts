import { GoogleGenAI } from "@google/genai";
import { DEV_AI_INSTRUCTIONS } from "../constants";

export const generateAIContentStream = async (
  prompt: string, 
  history: { role: string; content: string }[] = [],
  onChunk: (text: string) => void,
  overrideSystemInstruction?: string
) => {
  const globalObj = (typeof globalThis !== 'undefined' ? globalThis : window) as any;
  const keyPool: string[] = globalObj.process?.env?.API_KEYS || [];
  
  if (keyPool.length === 0) {
    throw new Error("Neural Hub connecting... Please try again.");
  }

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

  // Try each key in the pool if a quota error occurs
  let lastError = null;
  
  for (let i = 0; i < keyPool.length; i++) {
    const activeKey = keyPool[i];
    const ai = new GoogleGenAI({ apiKey: activeKey });
    
    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
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
      
      // If we got here, it worked! Update the "main" key for next time
      globalObj.process.env.API_KEY = activeKey;
      return fullText;

    } catch (error: any) {
      lastError = error;
      const msg = error?.message || error?.toString() || "";
      
      // If it's a quota error (429) or permission error (403), try the next key
      if (msg.includes("429") || msg.includes("403") || msg.includes("API key")) {
        console.warn(`Key ${i+1} failed or limited. Rotating to next engine...`);
        continue; 
      }
      
      // For other errors, just throw immediately
      throw error;
    }
  }

  // If we've looped through all keys and still have an error
  const finalMsg = lastError?.message || lastError?.toString() || "Server Congestion";
  if (finalMsg.includes("429")) {
    throw new Error("Daily Limit Reached: All AI Engines are at capacity. Please wait a few hours.");
  }
  throw new Error(finalMsg);
};