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

  // 打字机效果
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
        // 打完后等 0.8s，标记完成，进入下一步
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
        background: "#0d1117",
        padding: "24px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: "13px",
        color: "#e6edf3",
        minHeight: "280px",
        position: "relative",
      }}
    >
      {/* Terminal 扫描线效果 */}
      <div 
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, #3fb950, transparent)",
          animation: "scanline 3s linear infinite",
        }}
      />

      {/* Terminal 标题栏 */}
      <div className="flex items-center gap-2 mb-4 opacity-50">
        <span className="text-[#3fb950]">●</span>
        <span className="text-xs tracking-wide">SIGNOVA INTELLIGENCE</span>
      </div>

      {/* 已完成的步骤 */}
      <div className="space-y-2 mb-3">
        {completedSteps.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[#3fb950]"
          >
            <span>✓</span>
            <span>{steps[i]}</span>
          </motion.div>
        ))}
      </div>

      {/* 当前正在打字的步骤 */}
      {currentStep < steps.length && (
        <div className="flex items-center gap-2"
        >
          <span className="text-[#f0883e]">›</span>
          <span>{displayedText}</span>
          {/* 光标闪烁 */}
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-3.5 bg-[#e6edf3]"
          />
        </div>
      )}

      {/* 完成所有步骤后的提示 */}
      {completedSteps.length === steps.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-[#3fb950]"
        >
          Analysis complete. Rendering results...
        </motion.div>
      )}

      <style jsx>{`
        @keyframes scanline {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default TerminalAnimation;
