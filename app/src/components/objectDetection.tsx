import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function ObjectDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null); // Reference for overlay div
  const [model, setModel] = useState<any>(null); // To hold the loaded model
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [classificationResult, setClassificationResult] = useState<string>("");

  // Load the model when the component mounts
  useEffect(() => {
    async function loadModel() {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  // Access the webcam
  useEffect(() => {
    async function getWebcamStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the webcam: ", err);
      }
    }
    getWebcamStream();
  }, []);

  const captureAndProcessFrame = async () => {
    if (!canvasRef.current || !videoRef.current || !model) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Draw the current video frame to the canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Perform object detection
    const predictions = await model.detect(videoRef.current);

    // Store detected object classes without duplicates
    const newDetectedObjects: string[] = [];

    if (overlayRef.current) {
      // Clear previous boxes
      overlayRef.current.innerHTML = "";

      // Handle predictions
      for (const prediction of predictions) {
        const [xmin, ymin, width, height] = prediction.bbox;
        const score = prediction.score;

        if (score < 0.5) continue; // Only consider predictions above the confidence threshold

        // Avoid adding duplicate detected objects
        if (!newDetectedObjects.includes(prediction.class)) {
          newDetectedObjects.push(prediction.class);
        }

        // Create a new div for the bounding box
        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.border = "2px solid #4caf50"; // Use a modern green color for bounding boxes
        box.style.borderRadius = "4px"; // Rounded corners for a cleaner look
        box.style.left = `${xmin}px`;
        box.style.top = `${ymin}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
        box.style.pointerEvents = "none"; // Prevent interaction with the box
        box.style.boxShadow = "0 0 8px rgba(0, 0, 0, 0.5)"; // Slight shadow for depth

        // Optional: Add label text to the box
        const label = document.createElement("span");
        label.style.position = "absolute";
        label.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // Semi-transparent background
        label.style.color = "white";
        label.style.fontSize = "14px";
        label.style.fontWeight = "bold";
        label.style.padding = "2px 6px";
        label.style.borderRadius = "4px";
        label.innerText = `${prediction.class}: ${score.toFixed(2)}`;
        label.style.left = `${xmin}px`;
        label.style.top = `${ymin - 24}px`; // Adjust label position

        box.appendChild(label);
        overlayRef.current.appendChild(box);
      }
    }
    // Update the detected objects state
    setDetectedObjects(Array.from(newDetectedObjects));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [model]);

  return (
    <div className="relative w-full md:w-[640px] h-[480px] mx-auto flex justify-center items-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover border border-gray-300 rounded-lg shadow-lg"
      />
      <div
        ref={overlayRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        className="hidden"
      ></canvas>

      {detectedObjects.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white bg-opacity-80 p-4 rounded-lg shadow-md">
          <h4 className="font-bold text-lg text-gray-700">Detected Objects:</h4>
          <ul className="text-gray-600">
            {detectedObjects.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
          <button className="mt-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition">
            Classify with LLM
          </button>
        </div>
      )}

      {classificationResult && (
        <div className="absolute bottom-20 left-4 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
          <h4 className="font-bold text-lg text-gray-700">Classification Result:</h4>
          <p className="text-gray-600">{classificationResult}</p>
        </div>
      )}
    </div>
  );
}
