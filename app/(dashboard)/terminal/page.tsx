"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, FileText, Plus, Trash2, History, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  contractText?: string;
  createdAt: Date;
}

const QUICK_QUESTIONS = [
  "What should I look for in an NDA?",
  "Is this termination clause fair?",
  "Explain liability clauses",
  "What are standard payment terms?",
  "How do I negotiate an MSA?",
  "What is governing law?",
  "Explain IP ownership clauses",
  "What should a service agreement include?",
];

export default function TerminalPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [contractText, setContractText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showContractInput, setShowContractInput] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("terminalChatHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          messages: chat.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        })));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history
  const saveChatHistory = (newMessages: Message[], contract?: string) => {
    if (newMessages.length === 0) return;
    
    const title = newMessages[0].content.slice(0, 50) + (newMessages[0].content.length > 50 ? "..." : "");
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title,
      messages: newMessages,
      contractText: contract,
      createdAt: new Date(),
    };
    
    const updated = [newSession, ...chatHistory].slice(0, 20); // Keep last 20
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
          history: messages.slice(-6), // Send last 6 messages for context
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
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeContract = async () => {
    if (!contractText.trim()) return;
    
    setShowContractInput(false);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: "Please analyze this contract",
      timestamp: new Date(),
    };

    setMessages([userMessage]);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/terminal/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Analyze this contract and identify key terms, risks, and suggestions for improvement.",
          contractText,
        }),
      });

      if (!res.ok) throw new Error("Failed to analyze");

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      const finalMessages = [userMessage, assistantMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages, contractText);
    } catch (error) {
      console.error("Analysis error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I couldn't analyze the contract. Please ensure the text is clear and try again.",
        timestamp: new Date(),
      };
      
      setMessages([userMessage, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    if (contractText) {
      handleSendMessage(question);
    } else {
      // General legal question without contract
      handleSendMessage(question);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setContractText("");
    setShowContractInput(true);
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
              <p className="p-4 text-sm text-[#9CA3AF] text-center">No chat history yet</p>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className="p-3 border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-[#374151] line-clamp-2 flex-1 mr-2">{chat.title}</p>
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">AI Legal Assistant</h1>
            <p className="text-sm text-[#6B7280]">
              {contractText 
                ? "Analyzing your contract - ask anything about it"
                : "Ask legal questions or paste contract text for analysis"
              }
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
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1A1A1A]">Paste Contract Text</h3>
                  <p className="text-sm text-[#6B7280]">Or skip and ask general legal questions</p>
                </div>
              </div>
              
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste your contract text here for analysis..."
                rows={10}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none"
              />
              
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setShowContractInput(false)}
                  className="text-sm text-[#6B7280] hover:text-[#1A1A1A]"
                >
                  Skip & ask general questions →
                </button>
                
                <button
                  onClick={handleAnalyzeContract}
                  disabled={!contractText.trim() || isAnalyzing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      Analyze Contract
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Questions */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-[#6B7280] mb-4">Popular Legal Questions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUICK_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowContractInput(false);
                      handleQuickQuestion(question);
                    }}
                    className="p-3 text-left text-sm bg-white border border-[#E5E7EB] rounded-lg hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        {!showContractInput && (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">How can I help you today?</h3>
                  <p className="text-sm text-[#6B7280]">
                    {contractText 
                      ? "Ask me anything about your contract"
                      : "Ask legal questions or start a new chat to analyze a contract"
                    }
                  </p>
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
                            message.role === "user" ? "text-gray-400" : "text-[#9CA3AF]"
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
                  
                  {isAnalyzing && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#E5E7EB] px-4 py-3 rounded-2xl">
                        <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" />
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#E5E7EB] bg-white p-4">
              {contractText && (
                <div className="max-w-3xl mx-auto mb-3 px-3 py-2 bg-[#FEF3C7]/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#B45309]">
                    <FileText className="w-4 h-4" />
                    Contract text loaded
                  </div>
                  <button
                    onClick={() => setContractText("")}
                    className="text-xs text-[#9CA3AF] hover:text-red-500"
                  >
                    Clear
                  </button>
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
                    contractText
                      ? "Ask about this contract..."
                      : "Ask a legal question..."
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
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
