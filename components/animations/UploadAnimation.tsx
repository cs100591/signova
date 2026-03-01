"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { FileText, Upload, Check } from "lucide-react";

const UPLOAD_STEPS = [
  { text: "Reading document...", duration: 1200 },
  { text: "Extracting key information...", duration: 2000 },
  { text: "Saving to your vault...", duration: 800 },
];

interface UploadAnimationProps {
  isUploading: boolean;
  isComplete: boolean;
  fileName?: string;
}

export const UploadAnimation = ({ 
  isUploading, 
  isComplete, 
  fileName 
}: UploadAnimationProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isUploading) {
      setStepIndex(0);
      setProgress(0);
      return;
    }

    let elapsed = 0;
    const total = UPLOAD_STEPS.reduce((sum, s) => sum + s.duration, 0);

    UPLOAD_STEPS.forEach((step, i) => {
      setTimeout(() => setStepIndex(i), elapsed);
      elapsed += step.duration;
    });

    // Progress bar
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95));
    }, total / 50);

    return () => clearInterval(interval);
  }, [isUploading]);

  useEffect(() => {
    if (isComplete) setProgress(100);
  }, [isComplete]);

  return (
    <AnimatePresence mode="wait">
      {/* Upload in progress */}
      {isUploading && !isComplete && (
        <motion.div
          key="uploading"
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3 }}
        >
          {/* File icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#FEF3C7] flex items-center justify-center"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FileText className="w-10 h-10 text-[#D97706]" />
          </motion.div>

          {/* File name */}
          {fileName && (
            <p className="text-center text-sm text-[#737373] mb-4 font-mono truncate px-4">
              {fileName}
            </p>
          )}

          {/* Progress bar */}
          <div className="h-2 bg-[#F5EFE6] rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Current step text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              className="text-center text-[15px] text-[#525252] font-mono"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {UPLOAD_STEPS[stepIndex]?.text}
            </motion.p>
          </AnimatePresence>

          {/* Progress percentage */}
          <p className="text-center text-xs text-[#A3A3A3] mt-2">{progress}%</p>
        </motion.div>
      )}

      {/* Upload complete */}
      {isComplete && (
        <motion.div
          key="complete"
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          {/* Success icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 15, 
              delay: 0.1 
            }}
          >
            <Check className="w-10 h-10 text-green-600" />
          </motion.div>
          
          <motion.p
            className="text-lg font-semibold text-[#1A1A1A]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Contract saved!
          </motion.p>
          
          <motion.p
            className="text-sm text-[#737373] mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Redirecting to analysis...
          </motion.p>
        </motion.div>
      )}

      {/* Idle state - simple upload hint */}
      {!isUploading && !isComplete && (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center"
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl border-2 border-dashed border-[#E6DCCA] flex items-center justify-center"
            animate={{ 
              borderColor: ["#E6DCCA", "#F59E0B", "#E6DCCA"],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Upload className="w-10 h-10 text-[#A3A3A3]" />
          </motion.div>
          <p className="text-[15px] text-[#737373]">Drop your contract here</p>
          <p className="text-sm text-[#A3A3A3] mt-1">
            PDF · JPG · PNG · Scanned documents supported
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadAnimation;
