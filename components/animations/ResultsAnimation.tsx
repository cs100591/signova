"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";

interface Finding {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  issue: string;
  quote?: string;
  explanation?: string;
  suggestion?: string;
}

export interface AnalysisResult {
  riskScore?: number;
  riskVerdict?: string;
  findings?: Finding[];
  missing?: string[];
  summary?: string[];
  model?: string;
}

interface RiskScoreCardProps {
  score?: number;
  verdict?: string;
}

// Risk score card
export const RiskScoreCard = ({ score = 50, verdict = "Analysis complete" }: RiskScoreCardProps) => {
  const getRiskConfig = (s: number) => {
    if (s <= 40) return { color: "#16a34a", label: "Low Risk", bg: "#f0fdf4" };
    if (s <= 70) return { color: "#d97706", label: "Medium Risk", bg: "#fffbeb" };
    return { color: "#dc2626", label: "High Risk", bg: "#fef2f2" };
  };

  const config = getRiskConfig(score);

  return (
    <motion.div
      className="rounded-xl p-6 mb-6"
      style={{ background: config.bg }}
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1A1A1A]">Overall Risk Score</h3>
        <span 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ 
            background: config.color + "20", 
            color: config.color 
          }}
        >
          {config.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-bold text-[#1A1A1A]">{score}</span>
        <span className="text-lg text-[#737373]">/ 100</span>
      </div>

      {/* Progress bar animation */}
      <div className="h-3 bg-white rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ background: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      <motion.p
        className="text-sm text-[#525252]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {verdict}
      </motion.p>
    </motion.div>
  );
};

interface FindingCardProps {
  finding: Finding;
  index: number;
}

// Individual Finding card
const FindingCard = ({ finding, index }: FindingCardProps) => {
  const getSeverityConfig = (s: string) => {
    switch (s) {
      case "HIGH":
        return { 
          icon: X, 
          color: "#dc2626", 
          bg: "#fef2f2",
          border: "border-red-200"
        };
      case "MEDIUM":
        return { 
          icon: AlertTriangle, 
          color: "#d97706", 
          bg: "#fffbeb",
          border: "border-yellow-200"
        };
      default:
        return { 
          icon: Check, 
          color: "#16a34a", 
          bg: "#f0fdf4",
          border: "border-green-200"
        };
    }
  };

  const config = getSeverityConfig(finding.severity);
  const Icon = config.icon;

  return (
    <motion.div
      className={`bg-white rounded-xl border p-5 ${config.border}`}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1],
        delay: index * 0.12
      }}
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: config.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-[#1A1A1A]">{finding.title}</h4>
            <span 
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ background: config.bg, color: config.color }}
            >
              {finding.severity}
            </span>
            <span className="text-xs text-[#A3A3A3]">{finding.category}</span>
          </div>
          
          <p className="text-sm text-[#737373] mb-3">{finding.issue}</p>
          
          {finding.explanation && (
            <p className="text-sm text-[#525252] mb-3">{finding.explanation}</p>
          )}
          
          {finding.quote && (
            <div className="bg-[#F5EFE6] rounded-lg p-3 mb-3">
              <p className="text-xs text-[#737373] mb-1">Original clause:</p>
              <p className="text-sm text-[#525252] font-mono italic">"{finding.quote}"</p>
            </div>
          )}
          
          {finding.suggestion && (
            <div className="border border-[#E6DCCA] rounded-lg p-3 bg-[#FFFBF5]">
              <p className="text-xs text-[#737373] mb-1">Suggested rewrite:</p>
              <p className="text-sm text-[#1A1A1A]">{finding.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface FindingsListProps {
  findings?: Finding[];
}

// Finding cards list
export const FindingsList = ({ findings = [] }: FindingsListProps) => {
  return (
    <div className="space-y-4">
      {findings.map((finding, i) => (
        <FindingCard key={i} finding={finding} index={i} />
      ))}
    </div>
  );
};

interface MissingProtectionsProps {
  items: string[];
}

// Missing protections
export const MissingProtections = ({ items }: MissingProtectionsProps) => {
  return (
    <motion.div
      className="bg-white rounded-xl border border-[#E6DCCA] p-5 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h4 className="font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
        <span className="text-gray-400">⚫</span>
        Missing Protections
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <p key={idx} className="text-sm text-[#737373] pl-6">
            — {item}
          </p>
        ))}
      </div>
    </motion.div>
  );
};

interface SummaryProps {
  points: string[];
}

// Key takeaways
export const Summary = ({ points }: SummaryProps) => {
  return (
    <motion.div
      className="bg-white rounded-xl border border-[#E6DCCA] p-5 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h4 className="font-semibold text-[#1A1A1A] mb-3">Key Takeaways</h4>
      <div className="space-y-3">
        {points.map((point, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-[#F59E0B] mt-0.5">•</span>
            <p className="text-sm text-[#525252]">{point}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface ResultsViewProps {
  result: AnalysisResult;
  isAnalyzing: boolean;
}

// Full results view
export const ResultsView = ({ result, isAnalyzing }: ResultsViewProps) => {
  return (
    <AnimatePresence mode="wait">
      {!isAnalyzing && result && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <RiskScoreCard 
            score={result.riskScore} 
            verdict={result.riskVerdict} 
          />
          
          <FindingsList findings={result.findings} />
          
          {result.missing && result.missing.length > 0 && (
            <MissingProtections items={result.missing} />
          )}
          
          {result.summary && result.summary.length > 0 && (
            <Summary points={result.summary} />
          )}
          
          {/* Fixed disclaimer */}
          <motion.div
            className="text-xs text-[#A3A3A3] text-center pt-6 pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            ⚠️ This analysis is for informational purposes only and does not constitute legal advice.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultsView;
