import { useEffect, useRef } from "react";
import { AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null); // Reference for overlay div
  let model: any = null;
  let processor: any = null;

  // Load the model and processor when the component mounts
  useEffect(() => {
    async function loadModelAndProcessor() {
      model = await AutoModel.from_pretrained('Xenova/gelan-c_all');
      processor = await AutoProcessor.from_pretrained('Xenova/gelan-c_all');
    }
    loadModelAndProcessor();
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
    if (!canvasRef.current || !videoRef.current || !model || !processor) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

    if (blob === null) {
      console.error("Failed to capture frame as a Blob.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      const image = await RawImage.read(base64Image);
      const inputs = await processor(image);

      const threshold = 0.5;
      const { outputs } = await model(inputs);
      const predictions = outputs.tolist();

      if (overlayRef.current) {
        // Clear previous boxes
        overlayRef.current.innerHTML = '';

        // Handle predictions
        for (const [xmin, ymin, xmax, ymax, score, id] of predictions) {
          if (score < threshold) continue;

          // Create a new div for the bounding box
          const box = document.createElement('div');
          box.style.position = 'absolute';
          box.style.border = '2px solid red';
          box.style.left = `${xmin}px`;
          box.style.top = `${ymin}px`;
          box.style.width = `${xmax - xmin}px`;
          box.style.height = `${ymax - ymin}px`;
          box.style.pointerEvents = 'none'; // Prevent interaction with the box

          // Optional: Add label text to the box
          const label = document.createElement('span');
          label.style.position = 'absolute';
          label.style.backgroundColor = 'white';
          label.style.color = 'black';
          label.style.fontSize = '16px';
          label.style.padding = '2px';
          label.innerText = `${model.config.id2label[id]}: ${score.toFixed(2)}`;
          label.style.left = `${xmin}px`;
          label.style.top = `${ymin - 20}px`; // Adjust label position

          box.appendChild(label);
          overlayRef.current.appendChild(box);
          
          console.log(`Found "${model.config.id2label[id]}" at [${xmin}, ${ymin}, ${xmax}, ${ymax}] with score ${score.toFixed(2)}.`);
        }
      }
    };

    reader.readAsDataURL(blob);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndProcessFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [model, processor]);

  return (
    <div style={{ position: 'relative', width: '640px', height: '480px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ 
          width: "100%", 
          height: "100%", 
          border: "1px solid black", 
          position: 'absolute', // Keep it absolute
          top: 0,
          left: 0,
        }} 
      />
      <div 
        ref={overlayRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 1, // Make sure overlay is on top
        }} 
      />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
    </div>
  );
}
