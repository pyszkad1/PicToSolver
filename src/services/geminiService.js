import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
Look only at the centered bridge diagram and completely ignore any partial diagrams cut off on the edges of the photo. 
Extract hands for North, East, South, and West.
CRITICAL RULE 1: The 4 hands MUST be outputted in exactly this order: North, East, South, West (clockwise).
Assume standard top-to-bottom suit order if symbols are blurry: Spades, Hearts, Diamonds, Clubs.
Pay special attention to "Voids" (e.g., if there is a Spades symbol but no numbers/letters next to it, that means the player has zero Spades).
CRITICAL RULE 2: The number 10 MUST ALWAYS be written as the capital letter "T". Never output "10".
The output from Gemini must be strictly the raw PBN string, formatted exactly like this example: 
[Deal "N:AKQJ.AKQ.AKQ.AKQ 432.432.432.432 543.543.543.543 987.987.987.987"] 
with no markdown formatting, no code blocks, and zero conversational filler.
`.trim();

export const extractPBNFromImage = async (base64Image, apiKey) => {
    if (!apiKey) {
        throw new Error("No Gemini API key provided. Please set your API key in Settings.");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/jpeg"
            },
        };

        const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
        const response = await result.response;
        const text = response.text().trim();

        // Validate that it looks like PBN and strictly enforce T instead of 10
        let pbnText = text;
        if (pbnText.startsWith("[") && pbnText.endsWith("]")) {
            pbnText = pbnText.replace(/10/g, 'T');
            return pbnText;
        } else {
            throw new Error("Invalid format received from Gemini: " + text);
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
