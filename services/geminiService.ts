import { GoogleGenAI } from "@google/genai";

/**
 * Enhances a rough work description into a professional timesheet entry.
 */
export const enhanceDescription = async (roughText: string): Promise<string> => {
  try {
    // Always use process.env.API_KEY directly when initializing the client.
    // Create a new instance right before making the call to ensure the latest key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using 'gemini-3-flash-preview' for basic text enhancement tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Reword the following timesheet work description to be more professional, concise, and suitable for a client invoice. Do not add any new facts, just polish the language. Text: "${roughText}"`,
    });

    // Access the .text property directly (not as a method call).
    return response.text?.trim() || roughText;
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    return roughText; // Fallback to original
  }
};