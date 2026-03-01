'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TerminalStep {
  text: string;
  status: 'waiting' | 'current' | 'completed';
}

interface AnalysisTerminalProps {
  isActive: boolean;
  onComplete?: () => void;
  userCountry?: string;
}

const TERMINAL_STEPS = [
  'Reading contract...',
  'Extracting text...',
  'Identifying clauses...',
  'Analyzing risk factors...',
];

export function AnalysisTerminal({ 
  isActive, 
  onComplete,
  userCountry = 'your country'
}: AnalysisTerminalProps) {
  const [steps, setSteps] = useState<TerminalStep[]>(
    TERMINAL_STEPS.map(text => ({ text, status: 'waiting' }))
  );
  const [displayTexts, setDisplayTexts] = useState<string[]>(new Array(TERMINAL_STEPS.length).fill(''));
  
  // Store timeout IDs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      setSteps(TERMINAL_STEPS.map(text => ({ text, status: 'waiting' })));
      setDisplayTexts(new Array(TERMINAL_STEPS.length).fill(''));
      return;
    }

    let currentStepIndex = 0;
    let charIndex = 0;

    const typeNextChar = () => {
      if (currentStepIndex >= TERMINAL_STEPS.length) {
        // All steps completed
        timeoutRef.current = setTimeout(() => {
          onComplete?.();
        }, 800);
        return;
      }

      const currentText = TERMINAL_STEPS[currentStepIndex];
      
      if (charIndex < currentText.length) {
        // Type next character
        setDisplayTexts(prev => {
          const newTexts = [...prev];
          newTexts[currentStepIndex] = currentText.slice(0, charIndex + 1);
          return newTexts;
        });
        charIndex++;
        timeoutRef.current = setTimeout(typeNextChar, 30);
      } else {
        // Step completed, add checkmark and move to next
        setSteps(prev => {
          const newSteps = [...prev];
          newSteps[currentStepIndex] = { 
            ...newSteps[currentStepIndex], 
            status: 'completed' 
          };
          if (currentStepIndex + 1 < TERMINAL_STEPS.length) {
            newSteps[currentStepIndex + 1] = {
              ...newSteps[currentStepIndex + 1],
              status: 'current'
            };
          }
          return newSteps;
        });
        
        currentStepIndex++;
        charIndex = 0;
        timeoutRef.current = setTimeout(typeNextChar, 200);
      }
    };

    // Start with first step as current
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[0] = { ...newSteps[0], status: 'current' };
      return newSteps;
    });

    typeNextChar();

    return () => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, onComplete]);

  const getStepIcon = (status: TerminalStep['status'], index: number) => {
    if (status === 'completed') {
      return (
        <motion.span 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[#16a34a] mr-2"
        >
          ✓
        </motion.span>
      );
    }
    if (status === 'current') {
      return <span className="text-[#c8873a] mr-2">›</span>;
    }
    return <span className="mr-2">  </span>;
  };

  const getStepColor = (status: TerminalStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-[#3a3530]';
      case 'current':
        return 'text-[#c8873a]';
      case 'waiting':
      default:
        return 'text-[#c8bfb5]';
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full border border-[#e0d9ce] rounded-xl p-5 bg-[#fafaf9] font-mono text-[13px]"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
    >
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center ${getStepColor(step.status)} ${index > 0 ? 'mt-2' : ''}`}
        >
          {getStepIcon(step.status, index)}
          <span>{displayTexts[index]}</span>
          {step.status === 'current' && displayTexts[index] === step.text && (
            <span className="inline-block w-2 h-4 bg-[#1a1714] ml-0.5 animate-pulse" />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
