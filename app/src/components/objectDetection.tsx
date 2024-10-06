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
  };

  // Handle classification using LLM API
  const classifyObjects = async () => {
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

            // Prepare the JSON payload
            const jsonData = {
              image: base64data,
            };

            // // Stop the video stream to freeze the webcam
            // const stream = video.srcObject;
            // if (stream instanceof MediaStream) {
            //   const tracks = stream.getTracks();
            //   tracks.forEach(track => track.stop());
            // }

            const response = await fetch("/api/classify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(jsonData),
            });

            const data = await response.json();
            setClassificationResult(data.classification);
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
      className="relative w-full mx-auto flex justify-center items-center"
      style={{ width: videoSize.width, height: videoSize.height }}
    >
      {/* FRAME from here to */}
      <div>
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

        {isLoading ? (
          <div className="absolute top-2 center z-10 bg-white p-2 rounded-lg shadow-md">
            <p>Loading...</p>
          </div>
        ) : (
          classificationResult && (
            <div className="absolute top-2 center z-10 bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold">Classification Result:</h4>
              <p>{classificationResult}</p>
            </div>
        )
          )}
      </div>
      {/* Here */}

      <div>
        {/* Flip button centered and placed towards the bottom and right */}
        <div className="absolute bottom-[10%] z-10 transform translate-x-1/2 right-16">
          <button
            className="bg-blue-500 text-white rounded-lg shadow-md 
            text-sm sm:text-base md:text-lg 
            px-3 sm:px-4 md:px-5 py-1 sm:py-2 md:py-3"
            onClick={toggleCamera}
          >
            Flip
          </button>
        </div>

        {/* Circular button centered and placed towards the bottom */}
        <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 z-10">
          <button
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full shadow-lg text-white flex items-center justify-center 
          text-lg sm:text-xl md:text-2xl font-bold ${
            isDetecting ? "bg-green-500 hover:bg-green-600" : "bg-transparent border-4 border-white"
              }`}
            onMouseDown={() => {
              setIsDetecting(true);
              setIsLoading(true);
              setClassificationResult('');
            }}
            onMouseUp={() => {
              setIsDetecting(false);
              classifyObjects();
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
              classifyObjects();
            }}
          >
          </button>
        </div>
      </div>
    </div>
  );
}

