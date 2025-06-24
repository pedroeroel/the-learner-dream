"use server";

import { GoogleGenAI } from "@google/genai";


export default async function generateQuestions(prompt: string) {
    const keys = process.env.GENAI_KEYS?.split(",").map(k => k.trim()).filter(Boolean) || [];
    let ai: GoogleGenAI | null = null;
    let lastError: any = null;

    for (const [i, key] of keys.entries()) {
        try {
            const testAi = new GoogleGenAI({ apiKey: key });
            // Try a lightweight API call to check if the key is valid
            await testAi.models.list(); // This will throw if the key is invalid
            ai = testAi;
            console.log(`Using GENAI_KEY number ${i + 1} of ${keys.length}`);
            break;
        } catch (e) {
            lastError = e;
            ai = null;
        }
    }
    
    if (!ai) {
        throw new Error("No valid GENAI_KEYS found." + (lastError ? ` Last error: ${lastError}` : ""));
    }

    if (ai) {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                systemInstruction: "You're a specialist in creating exercises to train the user's knowledge. Generate a quiz with the numbers of questions the user asks (if not, just 10 questions), about the theme he asks, each with 5 (or the number the user asks) possible answers. Indicate the correct answer for each question with their index (starting from 0). ONLY return the array of questions as a valid JSON array, with no extra text, no explanations, and no formatting. Do not include any introductory or closing remarks. The response must be exactly: [{question: 'Question text', answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Answer 5'], correctAnswer: 0}, ...]. ENSURE THAT THE CORRECT ANSWER IS REALLY ACCURATE.",
                maxOutputTokens: 1000,
            }
        });

        let questions: Array<{ question: string; answers: string[]; correctAnswer: number }> = [];
        try {
            // @ts-expect-error necessary because the response type is not strictly defined
            const cleanedText = response.text.replace(/^\s*```json\s*|^\s*```\s*$/gim, "");
            questions = JSON.parse(cleanedText as string);
        } catch (e) {
            console.error("Failed to parse questions:", e);
        }
        console.log(questions);
        return questions;
    }
    throw new Error("Failed to initialize GoogleGenAI.");
}
