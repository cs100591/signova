'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisTerminal } from './AnalysisTerminal';
import { RiskScoreCard } from './RiskScoreCard';
import { FindingCards } from './FindingCards';
import { WaitingRobot } from '@/components/illustrations/RobotIllustrations';
import { MarkdownMessage } from './MarkdownMessage';

interface Finding {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  issue: string;
  quote: string;
  explanation: string;
  suggestion: string;
}

interface AnalysisResult {
  riskScore: number;
  riskVerdict: string;
  findings: Finding[];
  missing: string[];
  summary: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'markdown' | 'analysis';
  analysisResult?: AnalysisResult;
}

interface ContractAnalysisProps {
  contractText: string;
  contractName: string;
  onSendMessage: (message: string) => void;
}

export function ContractAnalysis({ 
  contractText, 
  contractName, 
  onSendMessage 
}: ContractAnalysisProps) {
  const [analysisState, setAnalysisState] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showKeyTakeaways, setShowKeyTakeaways] = useState(false);

  const startAnalysis = useCallback(async () => {
    if (analysisState === 'scanning') return;
    
    setAnalysisState('scanning');
    
    try {
      // Call API to analyze contract
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractText,
          userCountry: 'your country' // This should come from user profile
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      setAnalysisState('complete');
      
      // Show key takeaways after a delay
      setTimeout(() => {
        setShowKeyTakeaways(true);
      }, 6000);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisState('error');
    }
  }, [contractText, analysisState]);

  const handleTerminalComplete = useCallback(() => {
    // Terminal animation complete, now show results
  }, []);

  // Render idle state
  if (analysisState === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <WaitingRobot size={160} />
        <h3 className="text-lg font-semibold text-[#1a1714] mt-4 mb-2">
          AI Contract Analysis
        </h3>
        <p className="text-sm text-[#9a8f82] text-center max-w-sm">
          Upload a contract or ask me anything about legal matters
        </p>
        <button
          onClick={startAnalysis}
          className="mt-6 px-6 py-3 bg-[#1a1714] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
        >
          Start Analysis
        </button>
      </motion.div>
    );
  }

  // Render scanning state
  if (analysisState === 'scanning') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center py-8"
      >
        <div className="w-full max-w-md">
          <AnalysisTerminal 
            isActive={true} 
            onComplete={handleTerminalComplete}
          />
        </div>
      </motion.div>
    );
  }

  // Render complete state
  if (analysisState === 'complete' && analysisResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Risk Score Card */}
        <RiskScoreCard 
          score={analysisResult.riskScore} 
          verdict={analysisResult.riskVerdict}
          isVisible={true}
        />

        {/* Finding Cards */}
        <FindingCards 
          findings={analysisResult.findings}
          isVisible={true}
        />

        {/* Key Takeaways */}
        <AnimatePresence>
          {showKeyTakeaways && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-[#e0d9ce] rounded-xl p-5"
            >
              <h3 className="text-sm font-medium text-[#1a1714] mb-3">
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {analysisResult.summary.map((point, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-2 text-sm text-[#3a3530]"
                  >
                    <span className="text-[#c8873a] mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-[#9a8f82] pt-4"
        >
          ⚖️ This analysis is for informational purposes only and does not constitute legal advice.
        </motion.div>
      </motion.div>
    );
  }

  // Error state
  if (analysisState === 'error') {
    return (
      <div className="flex flex-col items-center py-12">
        <div className="text-[#dc2626] text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-[#1a1714] mb-2">
          Analysis Failed
        </h3>
        <p className="text-sm text-[#9a8f82] mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={startAnalysis}
          className="px-6 py-3 bg-[#1a1714] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return null;
}

// Regular chat message with Markdown
export function ChatMessage({ content }: { content: string }) {
  return <MarkdownMessage content={content} />;
}
