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
          newDetectedObjects.push(prediction.class);
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
  const classifyObjects = async (detectedObjects: string[]) => {
    console.log(detectedObjects);
    if (!videoRef.current || !model || !isDetecting) return;
  
    // Get the video element's dimensions
    const video = videoRef.current;
    const { videoWidth, videoHeight } = video;
  
    // Create a canvas element to draw the video frame
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    const context = canvas.getContext('2d');
    if (!context) return;
  
    // Draw the current video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    // Convert the canvas to a Blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result; // This will be the Base64 encoded image
  
            // Prepare the JSON payload, including detectedObjects
            const jsonData = {
              image: base64data,
              detectedObjects, // Pass detected objects to the backend
            };
  
            const response = await fetch("/api/classify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(jsonData),
            });
  
            const data = await response.json();
            setClassificationResult(data.classification);
  
            // Clear detectedObjects after classification
            setDetectedObjects([]);
          };
  
          // Read the Blob as a Base64 string
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error("Error classifying objects:", error);
        }
      } else {
        console.error("Failed to create Blob from canvas");
        setIsLoading(false);
      }
    }, "image/jpeg");
  };

  useEffect(() => {
    if (classificationResult !== "") {
      setIsLoading(false);
    }
  }, [classificationResult]);

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
  <div 
    className="relative bg-black w-full h-full max-h-screen overflow-hidden"
    style={{ 
      width: videoSize.width, 
      height: videoSize.height * 2,
      maxWidth: "100vw",
      maxHeight: "200vh"
    }}
  >
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
    
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-10"
    />
    
    <canvas
      ref={canvasRef}
      width={videoSize.width}
      height={videoSize.height}
      className="hidden"
    />

    {/* Status Overlay */}
    {isLoading ? (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
          <p className="text-sm">Processing...</p>
        </div>
      </div>
    ) : classificationResult && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
          <p className="text-sm">{classificationResult}</p>
        </div>
      </div>
    )}

    {/* Camera Controls */}
    <div className="absolute bottom-0 inset-x-0 pb-6 px-4 z-20">
      <div className="flex items-center justify-between">
        {/* Left side buttons */}
        <div className="flex flex-col items-center space-y-4">
          <button 
            className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center"
            onClick={toggleCamera}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Center - Capture button */}
        <button
          className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 ${
            isDetecting 
              ? "border-transparent bg-white scale-90" 
              : "border-white bg-transparent scale-100"
          }`}
          onMouseDown={() => {
            setIsDetecting(true);
            setIsLoading(true);
            setClassificationResult('');
          }}
          onMouseUp={() => {
            setIsDetecting(false);
            setClassificationResult('')
            classifyObjects(detectedObjects)
            UserScoreUpdater();
          }}
          onTouchStart={() => {
            setIsDetecting(true);
            setIsLoading(true);
            setClassificationResult('');
          }}
          onTouchEnd={() => {
            setIsDetecting(false);
            UserScoreUpdater();
            setClassificationResult('')
            classifyObjects(detectedObjects)
          }}
        >
          <div className={`w-16 h-16 rounded-full ${
            isDetecting ? "bg-red-500" : "bg-white"
          }`} />
        </button>

        {/* Right side - placeholder for symmetry */}
        <div className="w-12" />
      </div>
    </div>
  </div>
);
}
