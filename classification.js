import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();
// Load model
const model = await AutoModel.from_pretrained('Xenova/gelan-c_all', {
    // quantized: false,    // (Optional) Use unquantized version.
})

// Load processor
const processor = await AutoProcessor.from_pretrained('Xenova/gelan-c_all');
// processor.feature_extractor.size = { shortest_edge: 128 }    // (Optional) Update resize value

// Read image and run processor
const url = 'test3.jpg';
const image = await RawImage.read(url);
// console.log(image);
const inputs = await processor(image);

// Run object detection
const threshold = 0.3;
const { outputs } = await model(inputs);
const predictions = outputs.tolist();

let objects = [];

for (const [xmin, ymin, xmax, ymax, score, id] of predictions) {
    if (score < threshold) break;
    const bbox = [xmin, ymin, xmax, ymax].map(x => x.toFixed(2)).join(', ');
    objects.push(model.config.id2label[id]);
    // console.log(`Found "${model.config.id2label[id]}" at [${bbox}] with score ${score.toFixed(2)}.`)
}

console.log(objects);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = ` Given this array: ${objects}
only look at things that are thrown in the trash daily or very usually not occasional, so ignore any person and cell phone, 
and tell me where this trash should go: food waste or traditional recyclables or inorganic/non recyclable waste
If it's a bottle assume it's a plastic bottle
Give me just the answer like "Bottle: Traditional Recyclables" that's it`;

const result = await model2.generateContent(prompt);
console.log(result.response.text());
