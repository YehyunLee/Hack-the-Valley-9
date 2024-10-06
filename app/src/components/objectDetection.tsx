import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import axios from 'axios';

export default function ObjectDetection() {
  const { data: session } = useSession();
  const isUserAuthenticated = !!session?.user; // why double ! A. It's a shorthand way to convert a value to a boolean
  const userId = session?.user?.id as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<any>(null);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [classificationResult, setClassificationResult] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [cameraType, setCameraType] = useState<"user" | "environment">("environment");

  // Load the model when the component mounts
  useEffect(() => {
    async function loadModel() {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  // Function to stop the current video stream
  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  // Function to access the webcam
  const getWebcamStream = async () => {
    try {
      stopStream(); // Stop any active streams before switching
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraType }, // Use the selected camera (front or back)
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing the webcam: ", err);
    }
  };

  // Access the webcam when the component mounts and when the camera type changes
  useEffect(() => {
    getWebcamStream();
  }, [cameraType]);

  // Dynamically adjust video and canvas size based on screen size
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const maxWidth = screenWidth < 768 ? screenWidth - 40 : 640; // Max width 640 or screen width for mobile
      const aspectRatio = 4 / 3;
      const calculatedHeight = maxWidth / aspectRatio;

      setVideoSize({ width: maxWidth, height: calculatedHeight });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call initially to set the size based on the current screen

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Capture and process frame for object detection
  const captureAndProcessFrame = async () => {
    if (!canvasRef.current || !videoRef.current || !model || !isDetecting) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Get the actual video size used in object detection (from webcam)
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    // Get the displayed video size (resized)
    const displayedWidth = videoRef.current.clientWidth;
    const displayedHeight = videoRef.current.clientHeight;

    // Calculate scaling factors between the actual and displayed video sizes
    const scaleX = displayedWidth / videoWidth;
    const scaleY = displayedHeight / videoHeight;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const predictions = await model.detect(videoRef.current);
    const newDetectedObjects: string[] = [];

    if (overlayRef.current) {
      overlayRef.current.innerHTML = ""; // Clear previous overlays

      predictions.forEach((prediction: any) => {
        const [xmin, ymin, width, height] = prediction.bbox;
        const score = prediction.score;

        if (score < 0.6) return;

        if (!newDetectedObjects.includes(prediction.class)) {
          if (prediction.class !== "wine glass") {
            newDetectedObjects.push(prediction.class);
          }
        }

        // Scale the bounding box coordinates based on the scaling factors
        const scaledXmin = xmin * scaleX;
        const scaledYmin = ymin * scaleY;
        const scaledWidth = width * scaleX;
        const scaledHeight = height * scaleY;

        // Create bounding box
        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.border = "2px solid #4caf50";
        box.style.borderRadius = "4px";
        box.style.left = `${scaledXmin}px`;
        box.style.top = `${scaledYmin}px`;
        box.style.width = `${scaledWidth}px`;
        box.style.height = `${scaledHeight}px`;
        box.style.pointerEvents = "none";
        box.style.boxShadow = "0 0 8px rgba(0, 0, 0, 0.5)";

        // Create label
        const label = document.createElement("span");
        label.style.position = "absolute";
        label.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        label.style.color = "white";
        label.style.fontSize = "14px";
        label.style.padding = "2px 6px";
        label.style.borderRadius = "4px";
        label.innerText = `${prediction.class}: ${score.toFixed(2)}`;
        let labelX = scaledXmin;
        if (labelX > 24) {
          labelX = 24;
        }
        label.style.left = `${labelX}px`;
        label.style.top = `${scaledYmin - 24}px`;

        box.appendChild(label);
        if (overlayRef.current) {
          overlayRef.current.appendChild(box);
        }
      });
    }

    setDetectedObjects((prevDetectedObjects) => [
      ...new Set([...prevDetectedObjects, ...newDetectedObjects]),
    ]);
  };

  // Handle classification using LLM API
  const classifyObjects = async (objects: string[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objects }),
      });
      const data = await response.json();
      setClassificationResult(data.classification);
    } catch (error) {
      console.error("Error classifying objects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Continuously process frames while detecting
  useEffect(() => {
    if (!isDetecting) return;
    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [isDetecting]);

  // Function to toggle between front and back cameras
  const toggleCamera = () => {
    setCameraType((prevType) => (prevType === "user" ? "environment" : "user"));
  };

  // Add slight delay to object detection to allow UI to update quickly
  const handleMouseDown = () => {
    setIsDetecting(true); // Update button state immediately
    setTimeout(() => {
      setIsDetecting(true);
    }, 0); // Detect after UI updates
  };

  const handleMouseUp = () => {
    setIsDetecting(false);
  };

  const handleTouchStart = () => {
    setIsDetecting(true);
    setTimeout(() => {
      setIsDetecting(true);
    }, 0);
  };

  const handleTouchEnd = () => {
    setIsDetecting(false);
  };

  const UserScoreUpdater = () => {
    const handleIncrementScore = async (userId: string) => {
      try {
        const response = await axios.post('/api/db', {
          task: 'scoreIncrement',
          id: userId,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.data.success) {
          console.log("Score updated successfully!");
        } else {
          console.error("Failed to update score:", response.data.error);
        }
      } catch (error) {
        console.error("Failed to update score:", error);
      }
    };
    if (isUserAuthenticated) {
      handleIncrementScore(userId);
    }
  }

  return (
    <div className="relative w-full mx-auto flex justify-center items-center" style={{ width: videoSize.width, height: videoSize.height }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute top-0 left-0 object-cover border border-gray-300 rounded-lg shadow-lg"
        width={videoSize.width}
        height={videoSize.height}
      />
      <div
        ref={overlayRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: videoSize.width, height: videoSize.height }}
      />
      <canvas
        ref={canvasRef}
        width={videoSize.width}
        height={videoSize.height}
        className="hidden"
      ></canvas>

      {detectedObjects.length > 0 && (
        <div className="absolute bottom-5 left-4 z-10 bg-white bg-opacity-80 p-4 rounded-lg shadow-md">
          <h4 className="font-bold text-lg text-gray-700">Detected Objects:</h4>
          <ul className="text-gray-600">
            {detectedObjects.map((obj, idx) => (
              <li key={idx}>{obj}</li>
            ))}
          </ul>
          <button onClick={() => classifyObjects(detectedObjects)} className="mt-2 bg-blue-500 text-white py-1 px-3 rounded">
            Classify with LLM
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="absolute top-2 center z-10 bg-white p-2 rounded-lg shadow-md">
          <p>Loading...</p>
        </div>
      ) : classificationResult && (
        <div className="absolute top-2 center z-10 bg-white p-4 rounded-lg shadow-md">
          <h4 className="font-bold">Classification Result:</h4>
          <p>{classificationResult}</p>
        </div>
      )}

      <div className="absolute bottom-8 right-4 z-10">
        <button
          className="bg-blue-500 text-white rounded-lg shadow-md 
            text-sm sm:text-base md:text-lg 
            px-3 sm:px-4 md:px-5 py-1 sm:py-2 md:py-3"
          onClick={toggleCamera}
        >
          Flip Camera
        </button>
      </div>


      <div className="absolute bottom-5 flex justify-center w-full">
        <button
          className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full shadow-lg text-white flex items-center justify-center 
            text-lg sm:text-xl md:text-2xl font-bold ${isDetecting ? "bg-green-500 hover:bg-green-600" : "bg-transparent border-4 border-white"
            }`}
          onMouseDown={() => {
            setIsDetecting(true);
            setDetectedObjects([]); // Reset detected objects when detecting starts
          }}
          onMouseUp={() => {
            setIsDetecting(false)
            UserScoreUpdater();
          }
          }
          onTouchStart={() => {
            setIsDetecting(true);
            setDetectedObjects([]); // Reset detected objects when detecting starts
          }}
          onTouchEnd={() => {
            setIsDetecting(false)
            UserScoreUpdater();
          }

          }
        >
          
        </button>
      </div>

    </div>
  );
}
