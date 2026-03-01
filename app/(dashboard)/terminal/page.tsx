"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, FileText, Plus, Trash2, History, MessageSquare, Upload, ChevronDown, X } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
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
  "What are the termination conditions?",
  "Explain the payment terms",
  "What is the governing law?",
  "Summarize the key obligations",
];

const GENERAL_QUESTIONS = [
  "What should I look for in an NDA?",
  "Is this termination clause fair?",
  "Explain liability clauses",
  "What are standard payment terms?",
  "How do I negotiate an MSA?",
  "What is governing law?",
  "Explain IP ownership clauses",
  "What should a service agreement include?",
];

// Typing animation component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-[#E5E7EB] px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

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

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("terminalChatHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(
          parsed.map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            messages: chat.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          }))
        );
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }

    // Load saved contracts from Supabase
    loadSavedContracts();
  }, []);

  const loadSavedContracts = async () => {
    setLoadingContracts(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data, error } = await supabaseClient
        .from("contracts")
        .select("id, name, type, summary, extracted_text")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setSavedContracts(data);
      }
    } catch (e) {
      console.error("Failed to load saved contracts:", e);
    } finally {
      setLoadingContracts(false);
    }
  };

  const saveChatHistory = (newMessages: Message[], contract?: string) => {
    if (newMessages.length === 0) return;

    const title =
      newMessages[0].content.slice(0, 50) +
      (newMessages[0].content.length > 50 ? "..." : "");
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title,
      messages: newMessages,
      contractText: contract,
      createdAt: new Date(),
    };

    const updated = [newSession, ...chatHistory].slice(0, 20);
    setChatHistory(updated);
    localStorage.setItem("terminalChatHistory", JSON.stringify(updated));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contractText: contractText || undefined,
          history: messages.slice(-6),
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages, contractText);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // When user clicks "Analyze Contract" - starts chat with contract loaded
  const handleAnalyzeContract = async () => {
    if (!contractText.trim()) return;

    setShowContractInput(false);

    // Ask user's first question or default to analysis prompt
    const firstQuestion = inputText.trim() || "Please analyze this contract and identify key terms, risks, and what I should be aware of before signing.";

    await handleSendMessage(firstQuestion);
  };

  // Select from saved contracts
  const handleSelectContract = (contract: SavedContract) => {
    const text = contract.extracted_text || contract.summary || `Contract: ${contract.name} (${contract.type})`;
    setContractText(text);
    setContractName(contract.name);
    setShowContractDropdown(false);
    setInputMode("saved");
  };

  // Upload a text/PDF file directly
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".txt")) {
      const text = await file.text();
      setContractText(text);
      setContractName(file.name);
      setInputMode("upload");
    } else if (file.name.endsWith(".pdf")) {
      // For PDFs, upload to the extract endpoint
      const formData = new FormData();
      formData.append("file", file);

      try {
        setIsAnalyzing(true);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success && data.metadata) {
          // Use the summary as text context
          const text = [
            data.metadata.title && `Title: ${data.metadata.title}`,
            data.metadata.type && `Type: ${data.metadata.type}`,
            data.metadata.summary && `Summary: ${data.metadata.summary}`,
            data.metadata.parties?.party_a && `Party A: ${data.metadata.parties.party_a}`,
            data.metadata.parties?.party_b && `Party B: ${data.metadata.parties.party_b}`,
            data.metadata.dates?.effective_date && `Effective: ${data.metadata.dates.effective_date}`,
            data.metadata.dates?.expiry_date && `Expires: ${data.metadata.dates.expiry_date}`,
            data.metadata.risk_preview && `Risk Preview: ${data.metadata.risk_preview}`,
          ].filter(Boolean).join("\n");
          setContractText(text);
          setContractName(file.name);
          setInputMode("upload");
        } else {
          alert(data.details || "Could not extract text from PDF. Please try a .txt file.");
        }
      } catch (err) {
        alert("Failed to process PDF. Please try a .txt file instead.");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      alert("Please upload a .txt or .pdf file.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleQuickQuestion = (question: string) => {
    setShowContractInput(false);
    handleSendMessage(question);
  };

  const startNewChat = () => {
    setMessages([]);
    setContractText("");
    setContractName("");
    setInputText("");
    setShowContractInput(true);
    setInputMode("paste");
  };

  const loadChat = (session: ChatSession) => {
    setMessages(session.messages);
    setContractText(session.contractText || "");
    setShowContractInput(false);
    setShowHistory(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chatHistory.filter((chat) => chat.id !== id);
    setChatHistory(updated);
    localStorage.setItem("terminalChatHistory", JSON.stringify(updated));
  };

  return (
    <div className="flex h-full bg-[#F8F7F4]">
      {/* Sidebar - Chat History */}
      {showHistory && (
        <div className="w-72 bg-white border-r border-[#E5E7EB] flex flex-col">
          <div className="p-4 border-b border-[#E5E7EB]">
            <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
              <History className="w-4 h-4" />
              Chat History
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <p className="p-4 text-sm text-[#9CA3AF] text-center">
                No chat history yet
              </p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className="p-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-[#374151] line-clamp-2 flex-1 mr-2">
                      {chat.title}
                    </p>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {chat.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setShowHistory(false)}
            className="p-4 text-sm text-[#6B7280] hover:text-[#1A1A1A] border-t border-[#E5E7EB]"
          >
            Close History
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">AI Legal Assistant</h1>
            <p className="text-sm text-[#6B7280]">
              {contractText
                ? `Analyzing: ${contractName || "contract"} — ask anything about it`
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
              onClick={startNewChat}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </div>

        {/* Contract Input (shown initially) */}
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
                      Choose how you want to provide the contract
                    </p>
                  </div>
                </div>

                {/* Input mode tabs */}
                <div className="flex gap-2 mb-5">
                  {[
                    { id: "paste", label: "Paste Text" },
                    { id: "saved", label: "Saved Contracts" },
                    { id: "upload", label: "Upload File" },
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

                {/* Paste text mode */}
                {inputMode === "paste" && (
                  <textarea
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    placeholder="Paste your contract text here..."
                    rows={10}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none"
                  />
                )}

                {/* Saved contracts mode */}
                {inputMode === "saved" && (
                  <div>
                    {loadingContracts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-[#9CA3AF]" />
                      </div>
                    ) : savedContracts.length === 0 ? (
                      <div className="text-center py-8 text-[#9CA3AF]">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No saved contracts found.</p>
                        <p className="text-xs mt-1">Upload a contract first from the Contracts page.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {savedContracts.map((contract) => (
                          <button
                            key={contract.id}
                            onClick={() => handleSelectContract(contract)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                              contractName === contract.name
                                ? "border-[#F59E0B] bg-[#FEF3C7]/30"
                                : "border-[#E5E7EB] hover:border-[#F59E0B] hover:bg-[#FEF3C7]/20"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-[#9CA3AF]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A1A1A] text-sm truncate">
                                {contract.name}
                              </p>
                              <p className="text-xs text-[#9CA3AF] truncate">
                                {contract.type}
                                {contract.summary && ` — ${contract.summary.slice(0, 60)}...`}
                              </p>
                            </div>
                            {contractName === contract.name && (
                              <span className="text-[#F59E0B] text-xs font-medium flex-shrink-0">Selected</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {contractName && (
                      <div className="mt-3 p-2 bg-[#FEF3C7]/50 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-[#B45309] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {contractName} selected
                        </span>
                        <button
                          onClick={() => { setContractText(""); setContractName(""); }}
                          className="text-xs text-[#9CA3AF] hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload file mode */}
                {inputMode === "upload" && (
                  <div>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center cursor-pointer hover:border-[#F59E0B] hover:bg-[#FEF3C7]/20 transition-all"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3 text-[#9CA3AF]" />
                      <p className="font-medium text-[#374151]">
                        Click to upload a contract
                      </p>
                      <p className="text-sm text-[#9CA3AF] mt-1">
                        Supports .txt and .pdf files
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-[#6B7280]">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting text from PDF...
                      </div>
                    )}
                    {contractName && !isAnalyzing && (
                      <div className="mt-3 p-2 bg-[#FEF3C7]/50 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-[#B45309] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {contractName} loaded
                        </span>
                        <button
                          onClick={() => { setContractText(""); setContractName(""); }}
                          className="text-xs text-[#9CA3AF] hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={() => setShowContractInput(false)}
                    className="text-sm text-[#6B7280] hover:text-[#1A1A1A]"
                  >
                    Skip & ask general questions →
                  </button>

                  {contractText.trim() && (
                    <button
                      onClick={handleAnalyzeContract}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Analyze Contract
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Questions (general) */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-[#6B7280] mb-4">
                  Popular Legal Questions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {GENERAL_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question)}
                      className="p-3 text-left text-sm bg-white border border-[#E5E7EB] rounded-lg hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {!showContractInput && (
          <>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    {contractText
                      ? "Ask me anything about your contract"
                      : "Ask legal questions or load a contract"}
                  </p>

                  {/* Quick chip questions when contract is loaded */}
                  {contractText && (
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {QUICK_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-full hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all text-[#374151]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
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
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
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

                  {isAnalyzing && <TypingIndicator />}

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

              {/* Quick chips in chat mode (only when contract loaded and messages exist) */}
              {contractText && messages.length > 0 && (
                <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.slice(0, 4).map((q, idx) => (
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
