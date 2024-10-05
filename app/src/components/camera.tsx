import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

// Define types for the prediction
interface Prediction {
  bbox: [number, number, number, number]; // Bounding box: [x, y, width, height]
  class: string; // Detected object class
  score: number; // Confidence score
}

const ObjectDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null); // Ref for video element
  const [predictions, setPredictions] = useState<Prediction[]>([]); // State for predictions
  const [isWebcamStarted, setIsWebcamStarted] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<number | null>(null);

  const startWebcam = async () => {
    try {
      setIsWebcamStarted(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setIsWebcamStarted(false);
      console.error('Error accessing webcam:', error);
    }
  };

  useEffect(() => {
    if (isWebcamStarted) {
      const intervalId = window.setInterval(predictObject, 500);
      setDetectionInterval(intervalId);
    } else {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        setDetectionInterval(null);
      }
    }
  }, [isWebcamStarted, detectionInterval]);

  const predictObject = async () => {
    if (!videoRef.current) return;

    const model = await cocoSsd.load();
    model
      .detect(videoRef.current)
      .then((predictions) => {
        setPredictions(predictions);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const stopWebcam = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      video.srcObject = null;
      setPredictions([]);
      setIsWebcamStarted(false);
    }
  };

  return (
    <div className="object-detection">
      <div className="buttons">
        <button onClick={isWebcamStarted ? stopWebcam : startWebcam}>
          {isWebcamStarted ? 'Stop' : 'Start'} Webcam
        </button>
      </div>
      <div className="feed">
        {isWebcamStarted ? (
          <video ref={videoRef} autoPlay muted />
        ) : (
          <div />
        )}
        {predictions.length > 0 &&
          predictions.map((prediction, index) => (
            <React.Fragment key={index}>
              <p
                style={{
                  position: 'absolute',
                  left: `${prediction.bbox[0]}px`,
                  top: `${prediction.bbox[1]}px`,
                  width: `${prediction.bbox[2] - 100}px`,
                }}
              >
                {`${prediction.class} - with ${Math.round(
                  prediction.score * 100
                )}% confidence.`}
              </p>
              <div
                className="marker"
                style={{
                  position: 'absolute',
                  left: `${prediction.bbox[0]}px`,
                  top: `${prediction.bbox[1]}px`,
                  width: `${prediction.bbox[2]}px`,
                  height: `${prediction.bbox[3]}px`,
                  border: '2px solid red',
                }}
              />
            </React.Fragment>
          ))}
      </div>
      {predictions.length > 0 && (
        <div>
          <h3>Predictions:</h3>
          <ul>
            {predictions.map((prediction, index) => (
              <li key={index}>
                {`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;
