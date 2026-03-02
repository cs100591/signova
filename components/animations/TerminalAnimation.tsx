"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface TerminalAnimationProps {
  isAnalyzing: boolean;
  userCountry?: string;
}

const getSteps = (userCountry: string) => [
  "Scanning document structure...",
  "Identifying contract parties...",
  "Checking termination notice periods...",
  "Reviewing liability clauses...",
  "Comparing payment terms to industry standards...",
  `Cross-referencing ${userCountry} contract law...`,
  "Evaluating IP ownership clauses...",
  "Calculating overall risk score...",
  "Finalizing analysis...",
];

export const TerminalAnimation = ({ 
  isAnalyzing, 
  userCountry = "Malaysia" 
}: TerminalAnimationProps) => {
  const steps = getSteps(userCountry);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  // Typewriter effect
  useEffect(() => {
    if (!isAnalyzing) {
      setCompletedSteps([]);
      setCurrentStep(0);
      setDisplayedText("");
      return;
    }

    const text = steps[currentStep] || "";
    setDisplayedText("");
    let i = 0;
    const typeInterval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(typeInterval);
        // Wait 0.8s after typing, mark as complete, move to next step
        setTimeout(() => {
          setCompletedSteps((prev) => [...prev, currentStep]);
          setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
        }, 800);
      }
    }, 28);
    return () => clearInterval(typeInterval);
  }, [currentStep, isAnalyzing, steps]);

  if (!isAnalyzing) return null;

  return (
    <motion.div
      className="terminal rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "transparent",
        border: "1px solid #e0d9ce",
        borderRadius: "12px",
        padding: "20px 24px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
        color: "#3a3530",
        minHeight: "280px",
        position: "relative",
      }}
    >
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 mb-4 opacity-50">
        <span className="text-[#16a34a]">●</span>
        <span className="text-xs tracking-wide">SIGNOVA INTELLIGENCE</span>
      </div>

      {/* Completed steps */}
      <div className="space-y-2 mb-3">
        {completedSteps.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[#3a3530]"
          >
            <span className="text-[#16a34a]">✓</span>
            <span>{steps[i]}</span>
          </motion.div>
        ))}
      </div>

      {/* Current typing step */}
      {currentStep < steps.length && (
        <div className="flex items-center gap-2"
        >
          <span className="text-[#c8873a]">›</span>
          <span className="text-[#c8873a]">{displayedText}</span>
          {/* Cursor blinking */}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-3.5 bg-[#c8873a]"
          />
        </div>
      )}

      {/* Pending steps */}
      {steps.slice(currentStep + 1).map((step, idx) => (
        <div key={idx} className="flex items-center gap-2 mt-2 text-[#c8bfb5]">
          <span className="opacity-0">›</span>
          <span>{step}</span>
        </div>
      ))}

      {/* Completion message after all steps */}
      {completedSteps.length === steps.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-[#16a34a]"
        >
          Analysis complete. Rendering results...
        </motion.div>
      )}
    </motion.div>
  );
};

export default TerminalAnimation;
