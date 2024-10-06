import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function classifyObjects(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const { objects } = req.body;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key missing' });
    }

    const fileManager = new GoogleAIFileManager(apiKey);
    
    
}