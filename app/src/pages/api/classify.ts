// pages/api/classify.ts

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function classifyObjects(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key missing' });
    }

    // Ensure the request has an image
    if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'No image provided' });
    }

    try {
        console.time("Classification Backend Time");

        // Remove the data URL prefix if present and get the Base64 string
        const base64Image = req.body.image.split(',')[1];

        // Define a temporary file path
        const tempFilePath = path.join(process.cwd(), 'temp', 'captured_frame.jpeg');

        // Write the Base64 image to a file
        const buffer = Buffer.from(base64Image, 'base64');
        fs.writeFileSync(tempFilePath, buffer);

        const fileManager = new GoogleAIFileManager(apiKey);
        
        // Upload the image to Google Generative AI
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: 'image/jpeg',
        });
        fs.unlinkSync(tempFilePath);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Generate the content to extract objects from the image
        const result = await model.generateContent([
            "Tell me the objects in this image. Tell me the object name, xmin, ymin, width and height. Don't give me any extra information.",
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType,
                },
            },
        ]);

        const objectsResponse = await result.response.text();

        // Prepare the second prompt for classification
        const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `From these objects: ${objectsResponse},
            only look at things that are thrown in the trash daily or very usually and not occasional, so ignore any objects value such
            as person and electronics (laptop, refrigerator, tv, cell phone, hair dryer, remote), ignore fire hydrants, 
            wine glass, donuts, and tell me where this trash should go: compost or recyclables or inorganic waste.
            If it's a bottle, assume it's a plastic bottle. Give me the answer in this format "Bottle: Recyclables". Don't give any extra information.`;

        const result2 = await model2.generateContent(prompt);
        const classificationResponse = await result2.response.text();

        // Return the classification result
        res.status(200).json({ classification: classificationResponse });
    } catch (error) {
        console.error("Error classifying objects:", error);
        res.status(500).json({ error: 'Error classifying objects' });
    }
}
