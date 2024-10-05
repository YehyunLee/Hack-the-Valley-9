import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

export default function ObjectDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null); // Reference for overlay div
  const [model, setModel] = useState<any>(null); // To hold the loaded model

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

    if (overlayRef.current) {
      // Clear previous boxes
      overlayRef.current.innerHTML = "";

      // Handle predictions
      for (const prediction of predictions) {
        const [xmin, ymin, width, height] = prediction.bbox;
        const score = prediction.score;

        if (score < 0.5) continue; // Only consider predictions above the confidence threshold

        // Create a new div for the bounding box
        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.border = "2px solid red";
        box.style.left = `${xmin}px`;
        box.style.top = `${ymin}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
        box.style.pointerEvents = "none"; // Prevent interaction with the box

        // Optional: Add label text to the box
        const label = document.createElement("span");
        label.style.position = "absolute";
        label.style.backgroundColor = "white";
        label.style.color = "black";
        label.style.fontSize = "16px";
        label.style.padding = "2px";
        label.innerText = `${prediction.class}: ${score.toFixed(2)}`;
        label.style.left = `${xmin}px`;
        label.style.top = `${ymin - 20}px`; // Adjust label position

        box.appendChild(label);
        overlayRef.current.appendChild(box);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [model]);

  return (
    <div style={{ position: "relative", width: "640px", height: "480px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          border: "1px solid black",
          position: "absolute", // Keep it absolute
          top: 0,
          left: 0,
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1, // Make sure overlay is on top
        }}
      />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }}></canvas>
    </div>
  );
}