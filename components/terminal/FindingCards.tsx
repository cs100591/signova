'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';

interface Finding {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  issue: string;
  quote: string;
  explanation: string;
  suggestion: string;
}

interface FindingCardsProps {
  findings: Finding[];
  isVisible: boolean;
}

const severityConfig = {
  HIGH: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  MEDIUM: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  LOW: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
};

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const severity = severityConfig[finding.severity];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finding.suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: 0.54 + index * 0.12,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="bg-white border border-[#e0d9ce] rounded-xl overflow-hidden mb-3"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#fafaf9] transition-colors"
      >
        <div
          className="px-2 py-1 rounded text-xs font-semibold uppercase"
          style={{ 
            backgroundColor: severity.bg, 
            color: severity.text,
            border: `1px solid ${severity.border}`
          }}
        >
          {finding.severity}
        </div>
        <div className="flex-1">
          <div className="text-xs text-[#9a8f82] uppercase tracking-wide mb-1">
            {finding.category}
          </div>
          <div className="font-medium text-[#1a1714] text-sm">
            {finding.title}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-[#9a8f82]" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 border-t border-[#f0ede8] pt-3">
          {/* Quote */}
          <blockquote className="border-l-3 border-[#c8873a] pl-3 italic text-sm text-[#6b7280] mb-3">
            "{finding.quote}"
          </blockquote>

          {/* Issue */}
          <div className="mb-3">
            <div className="text-xs text-[#9a8f82] uppercase tracking-wide mb-1">
              Issue
            </div>
            <p className="text-sm text-[#3a3530]">{finding.issue}</p>
          </div>

          {/* Explanation */}
          <div className="mb-3">
            <div className="text-xs text-[#9a8f82] uppercase tracking-wide mb-1">
              Why this matters
            </div>
            <p className="text-sm text-[#3a3530]">{finding.explanation}</p>
          </div>

          {/* Suggestion */}
          {finding.suggestion && (
            <div className="bg-[#f5f0e8] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[#9a8f82] uppercase tracking-wide">
                  Suggested revision
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1a1714] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-[#3a3530] font-medium">
                {finding.suggestion}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FindingCards({ findings, isVisible }: FindingCardsProps) {
  if (!isVisible || findings.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-[#1a1714] mb-3 px-1">
        Key Findings ({findings.length})
      </h3>
      {findings.map((finding, index) => (
        <FindingCard 
          key={index} 
          finding={finding} 
          index={index}
        />
      ))}
    </div>
  );
}
