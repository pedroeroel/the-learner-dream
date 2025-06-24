"use server";

import { GoogleGenAI, Type } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.GENAI_KEY! });

export default async function generateQuestions(prompt: string) {
const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
        systemInstruction: "You're a specialist in creating exercises to train the user's knowledge. Generate a quiz with the numbers of questions the user asks (if not, just 10 questions), about the theme he asks, each with 5 (or the number the user asks) possible answers. Indicate the correct answer for each question with their index (starting from 0). ONLY return the array of questions as a valid JSON array, with no extra text, no explanations, and no formatting. Do not include any introductory or closing remarks. The response must be exactly: [{question: 'Question text', answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Answer 5'], correctAnswer: 0}, ...]. ENSURE THAT THE CORRECT ANSWER IS REALLY RELATABLE.",
        maxOutputTokens: 1000,
    }
});
    
    let questions: Array<{ question: string; answers: string[]; correctAnswer: number }> = [];
    try {
        //@ts-ignore
        const cleanedText = response.text.replace(/^\s*```json\s*|^\s*```\s*$/gim, "");
        questions = JSON.parse(cleanedText as string);
    } catch (e) {
        console.error("Failed to parse questions:", e);
    }
    console.log(questions);
  return questions;
}