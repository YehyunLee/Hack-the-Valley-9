import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "~/env"; // Import your env

// Classification function
const classifyObjects = async (objects: string[]): Promise<string> => {
  const apiKey = env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Given this array: ${objects.join(', ')}
    only look at things that are thrown in the trash daily or very usually not occasional, so ignore any person and cell phone, 
    and tell me where this trash should go: food waste or traditional recyclables or inorganic/non recyclable waste.
    If it's a bottle assume it's a plastic bottle.
    Give me just the answer like "Bottle: Traditional Recyclables"`;

  try {
    const result = await model2.generateContent(prompt);
    const textResponse = await result.response.text();
    return textResponse;  // Return the classification result
  } catch (error) {
    console.error("Error classifying the detected objects:", error);
    throw error;
  }
};

export default classifyObjects;
