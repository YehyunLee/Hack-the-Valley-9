import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import vision from '@google-cloud/vision';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';

// Create clients using your service account key
const base64Key = process.env.GOOGLE_API_KEY_BASE64;
if (!base64Key) {
  throw new Error("GOOGLE_API_KEY_BASE64 environment variable is not set.");
}

// Decode the Base64-encoded JSON key
const credentials = JSON.parse(
  Buffer.from(base64Key, 'base64').toString('utf-8')
);

// Create Google Cloud Storage client using the credentials
const storage = new Storage({
  credentials, // Use the decoded credentials
});

// Create Google Cloud Vision client using the credentials
const visionClient = new vision.ImageAnnotatorClient({
  credentials, // Use the decoded credentials
});

const bucketName = 'trashcam'; // Replace with your GCS bucket name

export default async function classifyObjects(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Ensure the request has an image
    if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'No image provided' });
    }
    try {
        // Extract the Base64 image data
        const base64Image = req.body.image.split(',')[1];

        // Convert Base64 to Buffer
        const imageBuffer = Buffer.from(base64Image, 'base64');

        // Create a unique filename
        const filename = `uploaded_image_${Date.now()}.jpeg`;

        // Upload the image to GCS
        const gcsFile = storage.bucket(bucketName).file(filename);
        await gcsFile.save(imageBuffer, {
            contentType: 'image/jpeg',
            resumable: false,
        });

        // Prepare the GCS image URI
        const fileUri = `gs://${bucketName}/${filename}`;

        // Use Cloud Vision API to detect objects
        const [result] = await visionClient.annotateImage({
            image: { source: { imageUri: fileUri } },
            features: [{ type: 'OBJECT_LOCALIZATION' }] // Specify the feature type
        });

        // Check if localizedObjectAnnotations exists
        if (!result || !result.localizedObjectAnnotations) {
            return res.status(500).json({ error: 'No objects detected in the image' });
        }


        const objects = result.localizedObjectAnnotations;

        // Prepare object names for the prompt
        const objectsResponse = objects.map(obj => obj.name).join(', ');
        console.log(objectsResponse);
        console.log(req.body.detectedObjects.join(' '))
        // Prepare the prompt for the Gemini API
        const prompt = `
            Here are the main computer vision and secondary computer vision outputs:

            Main computer vision: ${objectsResponse}
            Secondary computer vision: ${req.body.detectedObjects.join(' ')}

            Your task is to:
            Identify only the objects that appear in both the main and secondary computer vision.
            Focus only on objects that are commonly discarded as trash, such as packaging, food-related items, or household waste. Ignore clothes, tops, persons and electronics (like laptops, TVs, phones, keyboards etc.).
            If there is something in main computer vision result that is missing in secondary computer vision or secondary computer vision output is empty
            and the object is commonly discarded as trash, include it. Make sure to do this.


            Assumptions:
            Assume that bottles are plastic bottles. For each trash object, determine the category of waste it belongs to: Compost, Recyclables, or Inorganic Waste.

            Provide your response in the following format:
            {Object name}: {Types of Trash}
            Make sure to not add any extra text than that.

            Example Answer:
            Bottle: Recyclables
            Pizza: Compost

            REMINDER: Don't do a full breakdown in the answer!!

            If both computer visions are empty or both dont have anything commonly discarded as trash, just say "keep scanning!"
        `;
        console.log(prompt);
        // Create an instance of the GoogleGenerativeAI client
        const apiKey = process.env.GEMINI_API_KEY; // Your Gemini API Key
        if (!apiKey) return;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Call the Gemini API with the prepared prompt
        const result2 = await model.generateContent(prompt);
        const classificationResponse = await result2.response.text();

        // Return the classification result
        res.status(200).json({ classification: classificationResponse });

    } catch (error) {
        console.error("Error classifying objects:", error);
        res.status(500).json({ error: 'Error classifying objects' });
    }
}
