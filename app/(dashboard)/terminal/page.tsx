"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Check, 
  Bot, 
  AlertCircle, 
  ArrowUp, 
  Shield, 
  Upload, 
  FileText, 
  ChevronDown,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import TerminalAnimation from "@/components/animations/TerminalAnimation";
import { ResultsView } from "@/components/animations/ResultsAnimation";
import { RobotWaiting } from "@/components/illustrations";

// Mock contracts data
const contracts = [
  { id: 1, name: "Acme Corp MSA", type: "Service Agreement", icon: "💎" },
  { id: 2, name: "Dunder Mifflin Renewal", type: "Renewal", icon: "📄" },
  { id: 3, name: "Stark Industries NDA", type: "NDA", icon: "🛡️" },
];

// 快捷问题
const quickQuestions = [
  "对我不利的条款？",
  "这合约正常吗？",
  "终止条款怎么写？",
  "付款条件风险？",
];

interface AnalysisResult {
  analysis?: string;
  riskScore?: number;
  riskVerdict?: string;
  findings?: any[];
  missing?: string[];
  summary?: string[];
  model?: string;
  _parsed?: boolean;
}

export default function TerminalPage() {
  const [selectedContract, setSelectedContract] = useState<typeof contracts[0] | null>(null);
  const [selectedFocus, setSelectedFocus] = useState("Liability");
  const [showContractSelector, setShowContractSelector] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const focusAreas = [
    { name: "Termination", riskCount: 1 },
    { name: "Liability", riskCount: 2 },
    { name: "Payment", riskCount: 0 },
    { name: "IP", riskCount: 1 },
    { name: "Confidentiality", riskCount: 0 },
    { name: "Other", riskCount: 0 },
  ];

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isAnalyzing, analysisResult]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await fetch('/api/ai/analyze-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: "Either party may terminate this Agreement with ninety (90) days prior written notice. The Company shall not be liable for any indirect, incidental, or consequential damages.",
          focusArea: selectedFocus,
          analysisDepth: 'deep',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Analysis request failed');
      }
      
      const data = await response.json();
      
      // 检查是否成功解析为结构化数据
      if (data._parsed && data.riskScore !== undefined) {
        // 成功解析 JSON，直接设置结果
        setAnalysisResult(data);
      } else if (data.riskScore !== undefined) {
        // 有部分结构化数据
        setAnalysisResult(data);
      } else {
        // 返回的是原始文本（可能是简单分析模式）
        setAnalysisResult({
          analysis: data.analysis,
          model: data.model,
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 40) return "bg-green-500";
    if (score <= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskLabel = (score: number) => {
    if (score <= 40) return "Low Risk";
    if (score <= 70) return "Medium Risk";
    return "High Risk";
  };

  // Initial state - No contract selected
  if (!selectedContract) {
    return (
      <div className="flex h-full flex-col bg-[#FFFDF8] items-center justify-center p-10">
        <div className="text-center max-w-[500px]">
          <div className="mb-6">
            <RobotWaiting width={160} height={160} className="mx-auto" />
          </div>

          <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-3">
            AI Contract Analysis
          </h2>
          <p className="text-[15px] text-[#737373] mb-8">
            Select a contract to analyze or upload a new one
          </p>

          <div className="space-y-3 w-full mb-6">
            {contracts.map((contract) => (
              <button
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E6DCCA] hover:border-[#F59E0B] hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl">{contract.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-[#1A1A1A]">{contract.name}</div>
                  <div className="text-sm text-[#737373]">{contract.type}</div>
                </div>
                <span className="text-[#F59E0B] font-medium text-sm">Analyze →</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#E6DCCA]"></div>
            <span className="text-sm text-[#A3A3A3]">or</span>
            <div className="flex-1 h-px bg-[#E6DCCA]"></div>
          </div>

          <Link href="/upload">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-[#E6DCCA] rounded-xl text-[#737373] hover:border-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#FFFDF8] transition-all">
              <Upload className="w-5 h-5" />
              Upload New Contract
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Analysis state - Contract selected
  return (
    <div className="flex h-full flex-col bg-[#FFFDF8]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#E6DCCA]">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
          <span className="text-[13px] font-medium text-[#737373] tracking-wide">
            ACCORDO INTELLIGENCE
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowContractSelector(!showContractSelector)}
            className="flex items-center gap-2 text-sm text-[#525252] bg-white px-3 py-2 rounded-lg border border-[#E6DCCA] hover:border-[#F59E0B] transition-colors"
          >
            <span>{selectedContract.icon}</span>
            <span>{selectedContract.name}</span>
            <ChevronDown className="w-4 h-4 text-[#A3A3A3]" />
          </button>
          
          {showContractSelector && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-[#E6DCCA] shadow-lg z-10">
              <div className="p-2">
                {contracts.map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() => {
                      setSelectedContract(contract);
                      setShowContractSelector(false);
                      setAnalysisResult(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#F5EFE6] ${
                      selectedContract.id === contract.id ? "bg-[#FEF3C7]" : ""
                    }`}
                  >
                    <span>{contract.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#1A1A1A]">{contract.name}</div>
                      <div className="text-xs text-[#737373]">{contract.type}</div>
                    </div>
                  </button>
                ))}
                <hr className="my-2 border-[#E6DCCA]" />
                <Link href="/upload">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-[#F5EFE6] text-[#F59E0B]">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload New</span>
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-auto px-8 py-8 space-y-7">
        {/* Ready to analyze */}
        {!analysisResult && !isAnalyzing && (
          <>
            <hr className="border-[#E6DCCA]" />
            
            {/* Focus Selection */}
            <div className="space-y-4">
              <p className="text-[15px] font-medium text-[#1A1A1A] font-mono">
                What would you like to review?
              </p>
              
              <div className="flex flex-wrap gap-3">
                {focusAreas.map((area) => (
                  <button
                    key={area.name}
                    onClick={() => setSelectedFocus(area.name)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-[14px] transition-colors ${
                      selectedFocus === area.name
                        ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309] font-medium"
                        : "border-[#E6DCCA] text-[#525252] hover:bg-[#F5EFE6]"
                    }`}
                  >
                    {selectedFocus === area.name && <Check className="w-4 h-4" />}
                    {selectedFocus !== area.name && (
                      <span className="w-4 h-4 rounded border-2 border-[#D97706]" />
                    )}
                    <span>{area.name}</span>
                    {area.riskCount > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                        area.riskCount >= 2 ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {area.riskCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <button
                onClick={startAnalysis}
                className="mt-4 px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl font-medium transition-colors"
              >
                Start Analysis
              </button>
            </div>
          </>
        )}

        {/* Analysis Loading - Terminal Animation */}
        {isAnalyzing && (
          <TerminalAnimation 
            isAnalyzing={isAnalyzing} 
            userCountry="Malaysia" 
          />
        )}

        {/* Error State */}
        {analysisError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Analysis failed</span>
            </div>
            <p className="text-sm text-red-600">{analysisError}</p>
            <button
              onClick={() => {
                setAnalysisError(null);
                setAnalysisResult(null);
              }}
              className="mt-3 text-sm text-red-700 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Analysis Results with Animation */}
        {analysisResult && (
          <ResultsView result={analysisResult} isAnalyzing={isAnalyzing} />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="border-t border-[#E6DCCA] px-8 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#737373]">Quick questions:</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQuestions.map((question, idx) => (
            <button
              key={idx}
              onClick={() => {
                // TODO: Send quick question
                console.log('Quick question:', question);
              }}
              className="px-4 py-2 bg-white border border-[#E6DCCA] rounded-lg text-sm text-[#525252] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E6DCCA] px-8 py-5">
        <div className="flex items-end gap-3 bg-white rounded-2xl border border-[#E6DCCA] p-4">
          <input
            type="text"
            placeholder="Ask Signova anything about this contract..."
            className="flex-1 bg-transparent text-[15px] placeholder:text-[#A3A3A3] focus:outline-none font-mono"
          />
          <button className="w-10 h-10 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] flex items-center justify-center transition-colors">
            <ArrowUp className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <Shield className="w-3.5 h-3.5 text-[#A3A3A3]" />
          <span className="text-xs text-[#A3A3A3]">
            AI analysis for informational purposes only. Not legal advice.
          </span>
        </div>
      </div>
    </div>
  );
}
