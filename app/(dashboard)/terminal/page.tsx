'use client';

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, FileText, Plus, History, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WaitingRobot,
  ThinkingRobot,
  ClearRobot,
  RiskRobot
} from "@/components/illustrations/RobotIllustrations";
import { AnalysisTerminal } from "@/components/terminal/AnalysisTerminal";
import { RiskScoreCard } from "@/components/terminal/RiskScoreCard";
import { FindingCards } from "@/components/terminal/FindingCards";
import { MarkdownMessage } from "@/components/terminal/MarkdownMessage";
import { ChatTypingIndicator } from "@/components/terminal/ChatTypingIndicator";

interface Finding {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
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
  role: "user" | "assistant";
  content: string;
  type?: "text" | "analysis";
  analysisResult?: AnalysisResult;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "What clauses are risky for me?",
  "Is this contract standard?",
  "How can I negotiate this?",
  "What's missing from this contract?",
];

function TerminalPageInner() {
  const searchParams = useSearchParams();
  const contractIdParam = searchParams.get("contractId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contractText, setContractText] = useState("");
  const [contractName, setContractName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showContractInput, setShowContractInput] = useState(true);
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [linkedContractId, setLinkedContractId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  // ── Core analysis function ──────────────────────────────────────────────
  // Accept explicit text so React async state is never stale.
  // contractIdToSave: if set, PATCH the contract with results after analysis.
  const startContractAnalysis = async (textToAnalyze: string, contractIdToSave?: string | null) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 20) {
      setIsAnalyzing(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Please provide contract text (at least a few sentences) before analyzing.",
        timestamp: new Date(),
      }]);
      return;
    }

    const startTime = Date.now();
    const MIN_ANIMATION_MS = 3000;

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText: textToAnalyze,
          userCountry: "United States",
        }),
      });

      // Enforce minimum animation duration
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_ANIMATION_MS) {
        await new Promise(r => setTimeout(r, MIN_ANIMATION_MS - elapsed));
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const result: AnalysisResult = await response.json();

      setAnalysisResult(result);
      setIsAnalyzing(false);
      setAnalysisComplete(true);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Analysis complete",
        type: "analysis",
        analysisResult: result,
        timestamp: new Date(),
      }]);

      // Save analysis back to the contract if we came from a contract page
      if (contractIdToSave) {
        try {
          await fetch(`/api/contracts/${contractIdToSave}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              risk_score: result.riskScore,
              analysis_result: {
                riskScore: result.riskScore,
                verdict: result.riskVerdict,
                findings: result.findings,
                missing: result.missing,
                summary: result.summary,
              },
            }),
          });
          console.log("[Terminal] Analysis saved to contract", contractIdToSave);
        } catch (saveErr) {
          console.error("[Terminal] Failed to save analysis to contract:", saveErr);
        }
      }
    } catch (error: any) {
      console.error("[Terminal] Analysis error:", error);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_ANIMATION_MS) {
        await new Promise(r => setTimeout(r, MIN_ANIMATION_MS - elapsed));
      }

      setIsAnalyzing(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, analysis failed: ${error.message || "Unknown error"}. Please try again.`,
        timestamp: new Date(),
      }]);
    }
  };

  // ── Auto-load contract from URL param ──────────────────────────────────
  useEffect(() => {
    if (!contractIdParam) return;

    setLinkedContractId(contractIdParam);

    const autoLoad = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractIdParam}`);
        if (!res.ok) return;
        const contract = await res.json();

        // Build analysis text from available contract data
        const parts: string[] = [];
        if (contract.name) parts.push(`Contract: ${contract.name}`);
        if (contract.type) parts.push(`Type: ${contract.type}`);
        if (contract.party_a && contract.party_b) parts.push(`Parties: ${contract.party_a} and ${contract.party_b}`);
        if (contract.governing_law) parts.push(`Governing Law: ${contract.governing_law}`);
        if (contract.effective_date) parts.push(`Effective Date: ${contract.effective_date}`);
        if (contract.expiry_date) parts.push(`Expiry Date: ${contract.expiry_date}`);
        if (contract.summary) parts.push(`\nSummary:\n${contract.summary}`);

        if (parts.length === 0) return;

        const text = parts.join("\n");
        const name = contract.name || "Contract";

        setContractText(text);
        setContractName(name);
        setShowContractInput(false);
        setIsAnalyzing(true);

        setMessages([{
          id: Date.now().toString(),
          role: "user",
          content: `Analyze this contract: ${name}`,
          timestamp: new Date(),
        }]);

        await startContractAnalysis(text, contractIdParam);
      } catch (err) {
        console.error("[Terminal] Failed to auto-load contract:", err);
        setIsAnalyzing(false);
      }
    };

    autoLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Regular chat (with contract context) ───────────────────────────────
  const handleRegularChat = async (text: string) => {
    try {
      const response = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          contractText: contractText || undefined,
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        type: "text",
        timestamp: new Date(),
      }]);
    } catch (error: any) {
      console.error("[Terminal] Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Send message handler ────────────────────────────────────────────────
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAnalyzing || isTyping) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }]);
    setInputText("");
    setShowContractInput(false);

    // If we have contract text and haven't analysed yet → run analysis
    if (contractText && !analysisComplete) {
      setIsAnalyzing(true);
      await startContractAnalysis(contractText, linkedContractId);
    } else {
      setIsTyping(true);
      // Follow-up question or general chat
      await handleRegularChat(text);
    }
  };

  // ── PDF / file upload ───────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isTxt = file.type.startsWith("text/") || file.name.endsWith(".txt");

    if (isTxt) {
      // Plain text — just load it, no upload needed
      const text = await file.text();
      setContractText(text);
      setContractName(file.name);
      setInputMode("upload");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!isPdf) {
      alert("Please upload a PDF or text file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // PDF — immediately switch to chat + start animation
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `Analyze this contract: ${file.name}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setShowContractInput(false);
    setIsAnalyzing(true);
    setContractName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || "Could not extract text from PDF.");
      }

      const extractedText: string = data.extractedText || "";
      if (!extractedText || extractedText.trim().length < 20) {
        throw new Error("No readable text found in this PDF.");
      }

      setContractText(extractedText);

      // Pass text directly — avoids React async state staleness
      await startContractAnalysis(extractedText);
    } catch (err: any) {
      console.error("[Terminal] PDF upload error:", err);
      setIsAnalyzing(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I couldn't process this PDF: ${err.message}`,
        timestamp: new Date(),
      }]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Reset / new chat ────────────────────────────────────────────────────
  const handleNewChat = () => {
    setMessages([]);
    setContractText("");
    setContractName("");
    setShowContractInput(true);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  // ── Analysis result cards component ─────────────────────────────────────
  const AnalysisResultCards = ({ result }: { result: AnalysisResult }) => (
    <div className="w-full space-y-4">
      {/* Risk Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <RiskScoreCard
          score={result.riskScore}
          verdict={result.riskVerdict}
          isVisible={true}
        />
      </motion.div>

      {/* Finding Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <FindingCards findings={result.findings} isVisible={true} />
      </motion.div>

      {/* Key Takeaways */}
      {result.summary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-[#e0d9ce] rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-[#1a1714] mb-3">Key Takeaways</h3>
          <ul className="space-y-2">
            {result.summary.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#3a3530]">
                <span className="text-[#c8873a] mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Missing Protections */}
      {result.missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#FFF8F0] border border-[#F59E0B]/30 rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-[#92400e] mb-3">Missing Protections</h3>
          <ul className="space-y-1.5">
            {result.missing.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#78350f]">
                <span className="mt-0.5">⚠️</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-xs text-[#9a8f82] pt-2"
      >
        ⚖️ This analysis is for informational purposes only and does not constitute legal advice.
      </motion.p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#F8F7F4]">
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">AI Legal Assistant</h1>
            <p className="text-sm text-[#6B7280]">
              {contractName
                ? `Analyzing: ${contractName}`
                : "Ask legal questions or upload a contract for analysis"}
            </p>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* ── Contract Input (shown until user enters chat) ── */}
        {showContractInput && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">Load a Contract</h3>
                    <p className="text-sm text-[#6B7280]">Upload a PDF or paste contract text to get started</p>
                  </div>
                </div>

                {/* Input Mode Tabs */}
                <div className="flex gap-2 mb-5">
                  {(["paste", "upload"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setInputMode(mode)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${inputMode === mode
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                        }`}
                    >
                      {mode === "paste" ? "Paste Text" : "Upload PDF"}
                    </button>
                  ))}
                </div>

                {/* Paste Text */}
                {inputMode === "paste" && (
                  <textarea
                    value={contractText}
                    onChange={e => setContractText(e.target.value)}
                    placeholder="Paste your contract text here..."
                    rows={10}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none"
                  />
                )}

                {/* Upload */}
                {inputMode === "upload" && (
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-10 text-center cursor-pointer hover:border-[#F59E0B] hover:bg-[#FEF3C7]/20 transition-all"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3 text-[#9CA3AF]" />
                      <p className="font-medium text-[#374151]">Click to upload a PDF</p>
                      <p className="text-sm text-[#9CA3AF] mt-1">Supports PDF files — analysis starts immediately</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Action row */}
                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setShowContractInput(false)}
                    className="text-sm text-[#6B7280] hover:text-[#1A1A1A]"
                  >
                    Skip & ask general questions →
                  </button>

                  {contractText.trim() && inputMode === "paste" && (
                    <button
                      onClick={() => handleSendMessage("Please analyze this contract")}
                      disabled={isAnalyzing || isTyping}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] disabled:opacity-50 transition-colors"
                    >
                      Analyze Contract
                    </button>
                  )}
                </div>
              </div>

              {/* Empty state robot */}
              {!contractText && (
                <div className="flex flex-col items-center pt-4">
                  <WaitingRobot size={150} />
                  <h3 className="text-lg font-semibold text-[#1a1714] mt-4 mb-2">
                    AI Contract Analysis
                  </h3>
                  <p className="text-sm text-[#9a8f82] text-center max-w-sm">
                    Upload a contract or ask me anything about legal matters
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chat Interface ── */}
        {!showContractInput && (
          <>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {messages.length === 0 && !isAnalyzing && !analysisComplete ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <WaitingRobot size={120} />
                  <h3 className="text-lg font-medium text-[#1A1A1A] mt-4 mb-2">How can I help you today?</h3>
                  <p className="text-sm text-[#6B7280]">
                    {contractText ? "Ask me anything about your contract" : "Ask legal questions or load a contract"}
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Message list */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "analysis" && message.analysisResult ? (
                        // Analysis result cards - render inline at correct position
                        <div className="w-full max-w-2xl">
                          <AnalysisResultCards result={message.analysisResult} />
                        </div>
                      ) : (
                        // Regular text message
                        <div
                          className={`${
                            message.role === "user"
                              ? "bg-[#f5f0e8] text-[#1a1714] border border-[#e0d9ce] rounded-[16px_16px_4px_16px] p-[12px_16px] text-[13px] max-w-[70%]"
                              : "bg-white text-[#1a1714] border border-[#e0d9ce] rounded-[16px_16px_16px_4px] p-[12px_16px] text-[13px] max-w-[85%]"
                          }`}
                        >
                          <MarkdownMessage
                            content={message.content}
                            isUser={message.role === "user"}
                          />
                          <div className="text-[10px] text-[#9a8f82] mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Thinking animation (only during analysis) */}
                  {isAnalyzing && (
                    <div className="flex flex-col items-center py-8">
                      <ThinkingRobot size={160} className="mb-4" />
                      <AnalysisTerminal isActive={true} onComplete={() => { }} />
                    </div>
                  )}

                  {/* Normal chat typing indicator */}
                  {isTyping && (
                    <div className="mt-4">
                      <ChatTypingIndicator />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-[#E5E7EB] bg-white p-4 flex-shrink-0">
              {/* Contract loaded indicator */}
              {contractName && (
                <div className="max-w-3xl mx-auto mb-3 px-3 py-2 bg-[#FEF9E7] border border-[#FDE68A] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#B45309]">
                    <FileText className="w-4 h-4" />
                    {contractName} loaded
                  </div>
                  <button
                    onClick={() => { setContractText(""); setContractName(""); }}
                    className="text-xs text-[#9CA3AF] hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              )}

              {/* Quick question chips — only after analysis */}
              {contractText && analysisComplete && !isAnalyzing && (
                <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="px-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all text-[#374151]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Text input */}
              <div className="max-w-3xl mx-auto flex items-end gap-3">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputText);
                    }
                  }}
                  placeholder={contractText ? "Ask about this contract..." : "Ask a legal question..."}
                  rows={1}
                  disabled={isAnalyzing || isTyping}
                  className="flex-1 px-4 py-3 bg-white text-[#1A1A1A] border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none max-h-32 disabled:opacity-50 placeholder:text-[#9CA3AF]"
                  style={{ minHeight: "48px" }}
                />
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isAnalyzing || isTyping}
                  className="px-4 py-3 bg-[#F59E0B] text-white rounded-xl hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#9CA3AF] text-center mt-2">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" /></div>}>
      <TerminalPageInner />
    </Suspense>
  );
}
