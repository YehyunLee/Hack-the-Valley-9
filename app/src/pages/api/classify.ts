// pages/api/classify.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function classifyObjects(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const apiKey = process.env.GEMINI_API_KEY;
    const { objects } = req.body;
  
    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing' });
    }
  
    if (!objects || !Array.isArray(objects)) {
      return res.status(400).json({ error: 'Invalid input' });
    }
  
    try {
      console.time("Classification Backend Time");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const prompt = `From these objects: ${objects.join(', ')},
        only look at things that are thrown in the trash daily or very usually not occasional, so ignore any objects value such
        as person and electronics(etc, phone, laptops), and tell me where this trash should go: food waste or traditional recyclables or inorganic/non recyclable waste.
        If it's a bottle assume it's a plastic bottle. Give me just the answer like "Bottle: Traditional Recyclables" and do not include "scan other things".
        If you already identified something then don't say "Scan other things" 
        otherwise if nothing is a valid trash object, just answer  "Scan other things". Also ignore wine glass`;
  
      const result = await model2.generateContent(prompt);
      const textResponse = await result.response.text();
      console.timeEnd("Classification Backend Time");
      
      res.status(200).json({ classification: textResponse });
    } catch (error) {
      console.error("Error classifying objects:", error);
      res.status(500).json({ error: 'Error classifying objects' });
    }
  }
  
