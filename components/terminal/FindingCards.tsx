import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check, MessageSquare, ThumbsUp, HelpCircle, Loader2 } from 'lucide-react';
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

interface FindingCardsProps {
  findings: Finding[];
  isVisible: boolean;
  acknowledgedFindings?: string[];
  onAcknowledgeToggle?: (title: string) => void;
  onTellMeMore?: (finding: Finding) => void;
}

const severityConfig = {
  HIGH: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
  MEDIUM: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  LOW: { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
};

interface FindingCardProps {
  finding: Finding;
  index: number;
  isAcknowledged: boolean;
  onAcknowledgeToggle: () => void;
  onTellMeMore: () => void;
}

function FindingCard({ finding, index, isAcknowledged, onAcknowledgeToggle, onTellMeMore }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const severity = severityConfig[finding.severity];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finding.suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true); // Ensure it's open
    if (explanation) return; // Don't fetch again if already have it

    setIsExplaining(true);
    try {
      const res = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Explain this clause simply as if to a friend, and why it is a risk.",
          contractText: finding.quote || finding.issue,
        }),
      });
      const text = await res.text();
      setExplanation(text);
    } catch (err) {
      setExplanation("Failed to fetch explanation. Please try again.");
    } finally {
      setIsExplaining(false);
    }
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
      className={`bg-white border border-[#e0d9ce] rounded-xl overflow-hidden mb-3 transition-opacity duration-300 ${isAcknowledged ? 'opacity-50' : 'opacity-100'}`}
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
          <div className={`font-medium text-sm ${isAcknowledged ? 'text-[#9a8f82] line-through' : 'text-[#1a1714]'}`}>
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
          {finding.quote && (
            <blockquote className="border-l-[3px] border-[#c8873a] pl-3 italic text-sm text-[#6b7280] mb-4 bg-[#fdfaf5] py-2 pr-2 rounded-r-md">
              "{finding.quote}"
            </blockquote>
          )}

          {/* Issue */}
          <div className="mb-4">
            <div className="text-xs text-[#9a8f82] uppercase tracking-wide mb-1 font-semibold">
              Issue
            </div>
            <p className="text-sm text-[#3a3530]">{finding.issue}</p>
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <div className="text-xs text-[#9a8f82] uppercase tracking-wide mb-1 font-semibold">
              Why this matters
            </div>
            <p className="text-sm text-[#3a3530]">{finding.explanation}</p>
          </div>

          {/* Suggestion */}
          {finding.suggestion && (
            <div className="bg-[#f5f0e8] rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-[#9a8f82] uppercase tracking-wide font-semibold">
                  Suggested revision
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1a1714] transition-colors font-medium bg-white px-2 py-1 rounded shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-[#3a3530] font-medium leading-relaxed">
                {finding.suggestion}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0ede8]">
            <button
              onClick={(e) => { e.stopPropagation(); onAcknowledgeToggle(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isAcknowledged
                  ? 'text-[#16a34a] bg-[#f0fdf4] border-[#bbf7d0]'
                  : 'text-[#6b7280] bg-white border-[#e5e7eb] hover:bg-[#f0fdf4] hover:text-[#16a34a] hover:border-[#bbf7d0]'
              }`}
            >
              {isAcknowledged ? <Check className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
              {isAcknowledged ? 'Acknowledged' : 'Looks Good'}
            </button>
            <button
              onClick={handleExplain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8873a] bg-[#fffbeb] hover:bg-[#fef3c7] transition-colors border border-[#fde68a]"
            >
              {isExplaining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              Explain Simply
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTellMeMore(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors border border-[#e5e7eb]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Tell Me More
            </button>
          </div>

          {/* Inline AI Explanation */}
          <AnimatePresence>
            {explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-[#e0d9ce] rounded-xl px-6 py-5 text-sm relative">
                  <div className="absolute top-0 left-4 -mt-2 w-4 h-4 bg-white border-t border-l border-[#e0d9ce] rotate-45 transform" />
                  <div className="relative z-10">
                    <MarkdownMessage content={explanation} isUser={false} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FindingCards({ findings, isVisible, acknowledgedFindings = [], onAcknowledgeToggle, onTellMeMore }: FindingCardsProps) {
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
          isAcknowledged={acknowledgedFindings.includes(finding.title)}
          onAcknowledgeToggle={() => onAcknowledgeToggle?.(finding.title)}
          onTellMeMore={() => onTellMeMore?.(finding)}
        />
      ))}
    </div>
  );
}
