import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function ObjectDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null); // Reference for overlay div
  const [model, setModel] = useState<any>(null); // To hold the loaded model
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false); // Track detection state

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

  // Capture and process frame for object detection
  const captureAndProcessFrame = async () => {
    if (!canvasRef.current || !videoRef.current || !model || !isDetecting) return;

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
        box.style.border = "2px solid #4caf50";
        box.style.borderRadius = "4px";
        box.style.left = `${xmin}px`;
        box.style.top = `${ymin}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
        box.style.pointerEvents = "none";
        box.style.boxShadow = "0 0 8px rgba(0, 0, 0, 0.5)";

        // Add label text
        const label = document.createElement("span");
        label.style.position = "absolute";
        label.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        label.style.color = "white";
        label.style.fontSize = "14px";
        label.style.padding = "2px 6px";
        label.style.borderRadius = "4px";
        label.innerText = `${prediction.class}: ${score.toFixed(2)}`;
        label.style.left = `${xmin}px`;
        label.style.top = `${ymin - 24}px`;

        box.appendChild(label);
        overlayRef.current.appendChild(box);
      }
    }
    // Update the detected objects state (without duplicates)
    setDetectedObjects((prevDetectedObjects) => [
      ...new Set([...prevDetectedObjects, ...newDetectedObjects]),
    ]);
  };

  // Handle button press and hold detection
  const handleHoldStart = () => {
    setIsDetecting(true);
  };

  const handleHoldEnd = () => {
    setIsDetecting(false);
    callReleaseFunction(); // Call when the button is released
  };

  const callReleaseFunction = () => {
    console.log("Release button. You can add more logic here.");
  };

  // Continuously process frames while detecting
  useEffect(() => {
    if (!isDetecting) return;
    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [isDetecting]);

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
        <div className="absolute bottom-20 left-4 z-10 bg-white bg-opacity-80 p-4 rounded-lg shadow-md">
          <h4 className="font-bold text-lg text-gray-700">Detected Objects:</h4>
          <ul className="text-gray-600">
            {detectedObjects.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Circular Hold Button */}
      <div className="absolute bottom-8 flex justify-center w-full">
        <button
          className="w-20 h-20 bg-green-500 rounded-full shadow-lg text-white flex items-center justify-center text-xl font-bold hover:bg-green-600 transition"
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
        >
          Hold
        </button>
      </div>
    </div>
  );
}
