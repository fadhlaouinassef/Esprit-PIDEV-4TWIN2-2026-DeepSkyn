"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Camera, RefreshCw, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera access was denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera: " + (err.message || "Unknown error"));
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      setCapturedImage(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            Take a Photo
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <AlertCircle className="size-12 text-rose-500" />
              <div>
                <p className="text-gray-900 dark:text-white font-bold">Access Denied</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{error}</p>
              </div>
              <button
                onClick={startCamera}
                className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Video Feed */}
              {!capturedImage && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
              )}

              {/* Captured Preview */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Loading State */}
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 gap-3">
                  <RefreshCw className="size-8 text-primary animate-spin" />
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Initializing camera...</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center">
          {!error && !isInitializing && (
            <div className="flex items-center gap-4">
              {!capturedImage ? (
                <button
                  onClick={takePhoto}
                  className="size-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  aria-label="Take photo"
                >
                  <Camera size={28} />
                </button>
              ) : (
                <>
                  <button
                    onClick={retake}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <RefreshCw size={18} />
                    Retake
                  </button>
                  <button
                    onClick={confirmPhoto}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/30 hover:bg-primary/95 transition-all"
                  >
                    <Check size={18} />
                    Use This Photo
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
