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

  let lastError = null;
  
  // We loop through the pool. Since you now have a single new key, it will use it directly.
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
      
      // Successfully generated content with the new key
      globalObj.process.env.API_KEY = activeKey;
      return fullText;

    } catch (error: any) {
      lastError = error;
      const msg = error?.message || error?.toString() || "";
      
      // Handle quota or permission errors by attempting rotation (if applicable)
      if (msg.includes("429") || msg.includes("403") || msg.includes("API key")) {
        console.warn(`AI Engine ${i+1} reporting busy state. Retrying sequence...`);
        continue; 
      }
      
      throw error;
    }
  }

  const finalMsg = lastError?.message || lastError?.toString() || "Server Congestion";
  throw new Error(finalMsg);
};