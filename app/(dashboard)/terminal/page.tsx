'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, FileText, Plus, Trash2, History, MessageSquare, Upload, ChevronDown, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  WaitingRobot, 
  ThinkingRobot 
} from "@/components/illustrations/RobotIllustrations";
import { AnalysisTerminal } from "@/components/terminal/AnalysisTerminal";
import { RiskScoreCard } from "@/components/terminal/RiskScoreCard";
import { FindingCards } from "@/components/terminal/FindingCards";
import { MarkdownMessage } from "@/components/terminal/MarkdownMessage";

// Message types
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "analysis";
  analysisResult?: AnalysisResult;
  timestamp: Date;
}

interface AnalysisResult {
  riskScore: number;
  riskVerdict: string;
  findings: Finding[];
  missing: string[];
  summary: string[];
}

interface Finding {
  category: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  issue: string;
  quote: string;
  explanation: string;
  suggestion: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  contractText?: string;
  createdAt: Date;
}

interface SavedContract {
  id: string;
  name: string;
  type: string;
  summary?: string;
  extracted_text?: string;
}

const QUICK_QUESTIONS = [
  "What clauses are risky for me?",
  "Is this contract standard?",
  "How can I negotiate this?",
  "What's missing from this contract?",
];

export default function TerminalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contractText, setContractText] = useState("");
  const [contractName, setContractName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showContractInput, setShowContractInput] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [savedContracts, setSavedContracts] = useState<SavedContract[]>([]);
  const [showContractDropdown, setShowContractDropdown] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [inputMode, setInputMode] = useState<"paste" | "saved" | "upload">("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  // Handle sending message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAnalyzing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setShowContractInput(false);
    setIsAnalyzing(true);

    // Check if this is a contract analysis request
    if (contractText) {
      // Start analysis flow
      await startContractAnalysis();
    } else {
      // Regular chat
      await handleRegularChat(text);
    }
  };

  // Contract analysis flow
  const startContractAnalysis = async () => {
    const startTime = Date.now();
    const minAnimationDuration = 3000; // 3 seconds minimum
    
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractText,
          userCountry: "United States", // Should come from user profile
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result: AnalysisResult = await response.json();
      
      // Ensure animation shows for at least 3 seconds
      const elapsed = Date.now() - startTime;
      if (elapsed < minAnimationDuration) {
        await new Promise(resolve => setTimeout(resolve, minAnimationDuration - elapsed));
      }
      
      // Now set results (this will hide animation and show results)
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      // Add analysis result as a message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Analysis complete",
        type: "analysis",
        analysisResult: result,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Analysis error:", error);
      
      // Ensure animation shows for at least 3 seconds even on error
      const elapsed = Date.now() - startTime;
      if (elapsed < minAnimationDuration) {
        await new Promise(resolve => setTimeout(resolve, minAnimationDuration - elapsed));
      }
      
      setIsAnalyzing(false);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error analyzing the contract. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Regular chat flow
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
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        type: "text",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      // Handle PDF upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        setIsAnalyzing(true);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        
        if (data.success && data.metadata) {
          setContractText(data.extractedText || JSON.stringify(data.metadata, null, 2));
          setContractName(file.name);
          setInputMode("upload");
          setShowContractInput(false);
          
          // Start analysis
          await startContractAnalysis();
        } else {
          alert(data.details || "Could not extract text from PDF.");
        }
      } catch (err) {
        alert("Failed to process PDF.");
      } finally {
        setIsAnalyzing(false);
      }
    } else if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      const text = await file.text();
      setContractText(text);
      setContractName(file.name);
      setInputMode("upload");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Render analysis state with new components
  const renderAnalysisState = () => {
    if (!isAnalyzing && !analysisComplete) return null;

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Step 1: Terminal Animation */}
        <AnimatePresence>
          {isAnalyzing && !analysisComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <ThinkingRobot size={180} className="mb-6" />
              <AnalysisTerminal 
                isActive={true} 
                onComplete={() => {}} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Risk Score Card */}
        <AnimatePresence>
          {analysisComplete && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RiskScoreCard 
                score={analysisResult.riskScore}
                verdict={analysisResult.riskVerdict}
                isVisible={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Finding Cards */}
        <AnimatePresence>
          {analysisComplete && analysisResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <FindingCards 
                findings={analysisResult.findings}
                isVisible={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 4: Key Takeaways */}
        <AnimatePresence>
          {analysisComplete && analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-white border border-[#e0d9ce] rounded-xl p-5"
            >
              <h3 className="text-sm font-medium text-[#1a1714] mb-3">
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {analysisResult.summary.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#3a3530]">
                    <span className="text-[#c8873a] mt-0.5">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        {analysisComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-xs text-[#9a8f82] pt-4"
          >
            ⚖️ This analysis is for informational purposes only and does not constitute legal advice.
          </motion.p>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#F8F7F4]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              AI Legal Assistant
            </h1>
            <p className="text-sm text-[#6B7280]">
              {contractText
                ? `Analyzing: ${contractName || "contract"}`
                : "Ask legal questions or load a contract for analysis"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F4F6] rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>

            <button
              onClick={() => {
                setMessages([]);
                setContractText("");
                setContractName("");
                setShowContractInput(true);
                setAnalysisComplete(false);
                setAnalysisResult(null);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>

        {/* Contract Input */}
        {showContractInput && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">Load a Contract</h3>
                    <p className="text-sm text-[#6B7280]">
                      Upload a PDF or paste contract text
                    </p>
                  </div>
                </div>

                {/* Input Mode Tabs */}
                <div className="flex gap-2 mb-5">
                  {[
                    { id: "paste", label: "Paste Text" },
                    { id: "upload", label: "Upload PDF" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setInputMode(mode.id as any)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                        inputMode === mode.id
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {/* Paste Text Mode */}
                {inputMode === "paste" && (
                  <textarea
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    placeholder="Paste your contract text here..."
                    rows={10}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none"
                  />
                )}

                {/* Upload Mode */}
                {inputMode === "upload" && (
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center cursor-pointer hover:border-[#F59E0B] hover:bg-[#FEF3C7]/20 transition-all"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3 text-[#9CA3AF]" />
                      <p className="font-medium text-[#374151]">
                        Click to upload a PDF
                      </p>
                      <p className="text-sm text-[#9CA3AF] mt-1">
                        Supports PDF files
                      </p>
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

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setShowContractInput(false)}
                    className="text-sm text-[#6B7280] hover:text-[#1A1A1A]"
                  >
                    Skip & ask general questions →
                  </button>

                  {contractText.trim() && (
                    <button
                      onClick={() => handleSendMessage("Please analyze this contract")}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Analyze Contract
                    </button>
                  )}
                </div>
              </div>

              {/* Empty State with Robot */}
              {!contractText && (
                <div className="mt-12 flex flex-col items-center">
                  <WaitingRobot size={160} />
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

        {/* Chat/Analysis Interface */}
        {!showContractInput && (
          <>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {messages.length === 0 && !isAnalyzing && !analysisComplete ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <WaitingRobot size={120} />
                  <h3 className="text-lg font-medium text-[#1A1A1A] mt-4 mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    {contractText
                      ? "Ask me anything about your contract"
                      : "Ask legal questions or load a contract"}
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Messages */}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          message.role === "user"
                            ? "bg-[#1A1A1A] text-white"
                            : "bg-white border border-[#E5E7EB] text-[#1A1A1A]"
                        }`}
                      >
                        {message.type === "analysis" ? (
                          // Analysis results are rendered separately below
                          <div className="text-sm">Analysis complete ✓</div>
                        ) : (
                          <MarkdownMessage content={message.content} isUser={message.role === "user"} />
                        )}
                        <div
                          className={`text-xs mt-2 ${
                            message.role === "user"
                              ? "text-gray-400"
                              : "text-[#9CA3AF]"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Analysis State */}
                  {renderAnalysisState()}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#E5E7EB] bg-white p-4 flex-shrink-0">
              {contractText && (
                <div className="max-w-3xl mx-auto mb-3 px-3 py-2 bg-[#FEF3C7]/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#B45309]">
                    <FileText className="w-4 h-4" />
                    {contractName || "Contract text"} loaded
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

              {/* Quick Questions */}
              {contractText && messages.length > 0 && !isAnalyzing && (
                <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isAnalyzing}
                      className="px-3 py-1.5 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-full hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all text-[#374151] disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-w-3xl mx-auto flex items-end gap-3">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(inputText);
                    }
                  }}
                  placeholder={
                    contractText ? "Ask about this contract..." : "Ask a legal question..."
                  }
                  rows={1}
                  className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none max-h-32"
                  style={{ minHeight: "48px" }}
                />

                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isAnalyzing}
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
