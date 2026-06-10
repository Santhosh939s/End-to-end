import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw } from 'lucide-react';

interface FaceScannerProps {
  onCapture: (descriptor: Float32Array) => void;
  actionText?: string;
}

const FaceScanner: React.FC<FaceScannerProps> = ({ onCapture, actionText = 'Scan Face' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState<string>('Loading AI Models...');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelsLoaded(true);
        setStatus('Models loaded. Ready to scan.');
      } catch (err) {
        console.error('Failed to load models:', err);
        setStatus('Error loading AI models. Ensure /models directory exists.');
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setIsCameraActive(true);
      
      // We need to wait a tick for the video element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('Please look directly at the camera...');
        }
      }, 50);
    } catch (err) {
      console.error('Failed to access webcam:', err);
      setStatus('Webcam access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const captureAndExtract = async () => {
    if (!videoRef.current || isProcessing) return;
    setIsProcessing(true);
    setStatus('Analyzing face...');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setStatus('Face captured successfully!');
        stopCamera();
        onCapture(detection.descriptor);
      } else {
        setStatus('No face detected. Please try again in good lighting.');
      }
    } catch (error) {
      console.error('Extraction error:', error);
      setStatus('Error analyzing face.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-bg-panel border border-border-subtle p-6 rounded-2xl w-full max-w-md mx-auto shadow-sm">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-border-subtle flex items-center justify-center">
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary gap-2 z-10 bg-black">
            <Camera className="w-12 h-12 opacity-50" />
            <p className="text-sm">{isModelsLoaded ? 'Camera is off' : 'Loading...'}</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transform scale-x-[-1] ${isCameraActive ? 'block' : 'hidden'}`}
        />
      </div>

      <div className="text-center w-full">
        <p className="text-sm text-text-secondary mb-4 min-h-[1.25rem]">{status}</p>
        
        {!isCameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            disabled={!isModelsLoaded}
            className="w-full py-2.5 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" /> Start Camera
          </button>
        ) : (
          <button
            type="button"
            onClick={captureAndExtract}
            disabled={isProcessing}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceScanner;
