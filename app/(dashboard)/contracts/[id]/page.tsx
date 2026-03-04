"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Download,
  Archive,
  Trash2,
  Edit3,
  Calendar,
  DollarSign,
  Users,
  Scale,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import ExportPDFButton from "@/components/export-pdf-button";
import { ContractAnalysis } from "@/lib/pdf-export";
import { RiskLow, RiskMedium, RiskHigh, AnalysisComplete } from "@/components/illustrations";
import PartySelectionModal from "@/components/PartySelectionModal";

interface Contract {
  id: string;
  name: string;
  type: string;
  summary: string;
  amount: string;
  currency: string;
  effective_date: string;
  expiry_date: string | null;
  party_a: string;
  party_b: string;
  governing_law: string;
  status?: string;
  risk_score?: number;
  analysis_result?: any;
  file_url?: string;
  created_at: string;
  versions?: any[];
}

const getStatus = (contract: Contract): "active" | "expiring_soon" | "expired" | "indefinite" => {
  if (!contract.expiry_date) return "indefinite";
  const now = Date.now();
  const expiry = new Date(contract.expiry_date).getTime();
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "active";
};

const getStatusBadge = (status: string, daysLeft?: number) => {
  switch (status) {
    case "expired":
      return { color: "bg-red-100 text-red-700 border-red-200", label: "Expired", icon: XCircle };
    case "expiring_soon":
      return {
        color: "bg-orange-100 text-orange-700 border-orange-200",
        label: daysLeft !== undefined ? `Exp: ${daysLeft} days` : "Expiring soon",
        icon: AlertCircle,
      };
    case "indefinite":
      return { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Indefinite", icon: CheckCircle2 };
    default:
      return { color: "bg-green-100 text-green-700 border-green-200", label: "Active", icon: CheckCircle2 };
  }
};

const getRiskColor = (score: number) => {
  if (score <= 40) return "text-green-600";
  if (score <= 70) return "text-yellow-600";
  return "text-red-600";
};

// Parse analysis_result JSONB into ContractAnalysis shape
const parseAnalysis = (contract: Contract): ContractAnalysis | null => {
  if (!contract.analysis_result) return null;

  const raw = contract.analysis_result;

  // If already in expected shape
  if (raw.findings && raw.summary) return raw as ContractAnalysis;

  // Try to parse from raw text format if stored as string
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  return null;
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleting, setDeleting] = useState(false);
  const [partyModal, setPartyModal] = useState<{ partyA: any; partyB: any; contractType: string | null } | null>(null);

  useEffect(() => {
    if (!contractId) return;
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setContract(null);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch contract");
      const data = await res.json();
      setContract(data);
    } catch (err) {
      console.error("Error fetching contract:", err);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this contract? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/contracts");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!contract) return;
    setPartyModal({
      partyA: contract.party_a ? { name: contract.party_a, role: "" } : null,
      partyB: contract.party_b ? { name: contract.party_b, role: "" } : null,
      contractType: contract.type || null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            Contract not found
          </h2>
          <p className="text-[#6B7280] mb-4">
            This contract may have been deleted or does not belong to your account.
          </p>
          <Link href="/contracts" className="text-[#F59E0B] hover:underline">
            Back to contracts
          </Link>
        </div>
      </div>
    );
  }

  const status = getStatus(contract);
  const daysLeft =
    contract.expiry_date
      ? Math.ceil(
          (new Date(contract.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : undefined;
  const statusBadge = getStatusBadge(status, daysLeft);
  const analysis = parseAnalysis(contract);

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {partyModal && (
        <PartySelectionModal
          partyA={partyModal.partyA}
          partyB={partyModal.partyB}
          contractType={partyModal.contractType}
          onSelect={(selectedParty: string) => {
            setPartyModal(null);
            try { localStorage.setItem("terminalSelectedParty", selectedParty); } catch {}
            router.push(`/terminal?contractId=${contractId}`);
          }}
          onClose={() => {
            setPartyModal(null);
            router.push(`/terminal?contractId=${contractId}`);
          }}
        />
      )}
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB] px-8 py-5">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/contracts">
                <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
                </button>
              </Link>

              <div>
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                  {contract.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {contract.type && (
                    <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded">
                      {contract.type}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded border ${statusBadge.color}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/terminal?contractId=${contractId}`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FEF3C7] text-[#B45309] rounded-lg text-sm font-medium hover:bg-[#FDE68A] transition-colors">
                  <Bot className="w-4 h-4" />
                  Ask AI
                </button>
              </Link>

              {contract.file_url && (
                <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                  <button className="p-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors" title="Download PDF">
                    <Download className="w-4 h-4 text-[#6B7280]" />
                  </button>
                </a>
              )}

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete contract"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-400" />
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6">
            {["overview", "analysis"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                  activeTab === tab
                    ? "text-[#1A1A1A]"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Summary Card */}
                {contract.summary && (
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                    <h3 className="font-semibold text-[#1A1A1A] mb-3">Summary</h3>
                    <p className="text-[15px] text-[#525252] leading-relaxed">
                      {contract.summary}
                    </p>
                  </div>
                )}

                {/* Key Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {(contract.party_a || contract.party_b) && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#D97706]" />
                        </div>
                        <span className="text-sm text-[#6B7280]">Parties</span>
                      </div>
                      <div className="space-y-1">
                        {contract.party_a && (
                          <p className="font-medium text-[#1A1A1A]">{contract.party_a}</p>
                        )}
                        {contract.party_b && (
                          <p className="text-sm text-[#6B7280]">→ {contract.party_b}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {contract.amount && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-[#D97706]" />
                        </div>
                        <span className="text-sm text-[#6B7280]">Contract Value</span>
                      </div>
                      <p className="font-medium text-[#1A1A1A]">{contract.amount}</p>
                      {contract.currency && (
                        <p className="text-sm text-[#6B7280]">{contract.currency}</p>
                      )}
                    </div>
                  )}

                  {contract.effective_date && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[#D97706]" />
                        </div>
                        <span className="text-sm text-[#6B7280]">Effective Date</span>
                      </div>
                      <p className="font-medium text-[#1A1A1A]">
                        {new Date(contract.effective_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {contract.expiry_date && (
                        <p className="text-sm text-[#6B7280]">
                          Expires:{" "}
                          {new Date(contract.expiry_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {contract.governing_law && (
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                          <Scale className="w-5 h-5 text-[#D97706]" />
                        </div>
                        <span className="text-sm text-[#6B7280]">Governing Law</span>
                      </div>
                      <p className="font-medium text-[#1A1A1A]">
                        {contract.governing_law}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "analysis" && (
              <div>
                {!analysis ? (
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <AnalysisComplete width={180} height={180} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                        No analysis yet
                      </h3>
                      <p className="text-[#6B7280] mb-6">
                        Run AI analysis to identify risks and get improvement suggestions
                      </p>
                      <button
                        onClick={handleStartAnalysis}
                        className="px-6 py-3 bg-[#F59E0B] text-white rounded-xl font-medium hover:bg-[#D97706]"
                      >
                        Start AI Analysis
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Analysis Header */}
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#1A1A1A]">
                          AI Analysis Results
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleStartAnalysis}
                            className="px-3 py-1.5 text-xs bg-[#F3F4F6] text-[#374151] rounded-lg hover:bg-[#E5E7EB] transition-colors font-medium"
                          >
                            Analyze Again
                          </button>
                          <ExportPDFButton
                            analysis={analysis}
                            variant="secondary"
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            analysis.riskScore <= 40
                              ? "bg-green-100"
                              : analysis.riskScore <= 70
                              ? "bg-yellow-100"
                              : "bg-red-100"
                          }`}
                        >
                          <span
                            className={`text-2xl font-bold ${
                              analysis.riskScore <= 40
                                ? "text-green-600"
                                : analysis.riskScore <= 70
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {analysis.riskScore}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">
                            {analysis.riskScore <= 40
                              ? "Low Risk"
                              : analysis.riskScore <= 70
                              ? "Medium Risk"
                              : "High Risk"}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            {analysis.verdict}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Findings */}
                    {analysis.findings && analysis.findings.length > 0 && (
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                        <h3 className="font-semibold text-[#1A1A1A] mb-4">
                          Risk Findings ({analysis.findings.length})
                        </h3>
                        <div className="space-y-4">
                          {analysis.findings.map((finding: any, index: number) => (
                            <div
                              key={index}
                              className="border border-[#E5E7EB] rounded-lg p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    finding.severity === "HIGH"
                                      ? "bg-red-100 text-red-700"
                                      : finding.severity === "MEDIUM"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : finding.severity === "LOW"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {finding.severity}
                                </span>
                                <span className="text-xs text-[#6B7280]">
                                  {finding.category}
                                </span>
                              </div>
                              <h4 className="font-medium text-[#1A1A1A] mb-2">
                                {finding.title}
                              </h4>
                              <p className="text-sm text-[#6B7280] mb-3">
                                {finding.issue}
                              </p>
                              {finding.quote && (
                                <blockquote className="text-xs text-[#9CA3AF] italic border-l-2 border-[#E5E7EB] pl-3 mb-3">
                                  "{finding.quote}"
                                </blockquote>
                              )}
                              <p className="text-sm text-[#525252]">
                                {finding.explanation}
                              </p>
                              {finding.suggestion && (
                                <div className="mt-3 p-3 bg-[#F0FDF4] rounded-lg">
                                  <p className="text-xs font-medium text-green-700 mb-1">
                                    Suggested rewrite:
                                  </p>
                                  <p className="text-sm text-green-800">
                                    {finding.suggestion}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Protections */}
                    {analysis.missing && analysis.missing.length > 0 && (
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                        <h3 className="font-semibold text-[#1A1A1A] mb-4">
                          Missing Protections
                        </h3>
                        <ul className="space-y-2">
                          {analysis.missing.map((item: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-[#6B7280]"
                            >
                              <span className="text-gray-400 mt-0.5">⚫</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Executive Summary */}
                    {analysis.summary && analysis.summary.length > 0 && (
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                        <h3 className="font-semibold text-[#1A1A1A] mb-4">
                          Executive Summary
                        </h3>
                        <ul className="space-y-3">
                          {analysis.summary.map((point: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 text-sm text-[#525252]"
                            >
                              <span className="text-[#F59E0B] mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-[#9CA3AF] text-center">
                      Signova analysis is for informational purposes only and does not
                      constitute legal advice.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Risk Score Card */}
            {contract.risk_score !== undefined && contract.risk_score !== null && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">
                  Risk Assessment
                </h3>

                <div className="flex items-center justify-center mb-4">
                  {contract.risk_score <= 40 ? (
                    <RiskLow width={120} height={120} />
                  ) : contract.risk_score <= 70 ? (
                    <RiskMedium width={120} height={120} />
                  ) : (
                    <RiskHigh width={120} height={120} />
                  )}
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`text-3xl font-bold ${getRiskColor(contract.risk_score)}`}>
                      {contract.risk_score}
                    </span>
                    <span className="text-lg text-[#9CA3AF]">/100</span>
                  </div>
                  <p className={`font-medium ${getRiskColor(contract.risk_score)}`}>
                    {contract.risk_score <= 40
                      ? "Low Risk"
                      : contract.risk_score <= 70
                      ? "Medium Risk"
                      : "High Risk"}
                  </p>
                  <p className="text-sm text-[#6B7280] mt-1">Based on AI analysis</p>
                </div>

              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <Link href={`/terminal?contractId=${contractId}`} className="block">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left">
                    <Bot className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-sm text-[#374151]">Ask AI</span>
                  </button>
                </Link>

                {contract.file_url && (
                  <a href={contract.file_url} target="_blank" rel="noopener noreferrer" className="block">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left">
                      <Download className="w-4 h-4 text-[#6B7280]" />
                      <span className="text-sm text-[#374151]">Download PDF</span>
                    </button>
                  </a>
                )}

                {analysis && (
                  <div className="w-full">
                    <ExportPDFButton
                      analysis={analysis}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-4 py-3 h-auto"
                    />
                  </div>
                )}

                <hr className="border-[#E5E7EB]" />

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-red-600">Delete Contract</span>
                </button>
              </div>
            </div>

            {/* Contract Info */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Added</span>
                  <span className="text-[#374151]">
                    {new Date(contract.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {contract.type && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Type</span>
                    <span className="text-[#374151]">{contract.type}</span>
                  </div>
                )}
                {daysLeft !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Days left</span>
                    <span
                      className={
                        daysLeft < 0
                          ? "text-red-600 font-medium"
                          : daysLeft <= 30
                          ? "text-orange-600 font-medium"
                          : "text-[#374151]"
                      }
                    >
                      {daysLeft < 0 ? "Expired" : `${daysLeft} days`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Version History */}
            {contract.versions && contract.versions.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">Version History</h3>
                <div className="space-y-4">
                  {contract.versions.map((v: any, idx: number) => (
                    <div key={v.id} className="relative flex items-start gap-3">
                      {idx !== contract.versions!.length - 1 && (
                        <div className="absolute top-6 left-2.5 w-0.5 h-full bg-[#E5E7EB] -z-10" />
                      )}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${v.id === contract.id ? 'bg-[#F59E0B] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                        <div className="w-2 h-2 rounded-full bg-current" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Link href={`/contracts/${v.id}`} className={`text-sm font-medium hover:underline ${v.id === contract.id ? 'text-[#1A1A1A]' : 'text-[#4B5563]'}`}>
                            v{v.version || idx + 1}
                          </Link>
                          <span className="text-xs text-[#6B7280]">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {v.risk_score !== undefined && v.risk_score !== null && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className="text-[#6B7280]">Risk: {v.risk_score}</span>
                            <span>{v.risk_score <= 40 ? '🟢' : v.risk_score <= 70 ? '🟡' : '🔴'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/upload">
                      <button className="w-full py-2 border border-dashed border-[#D1D5DB] text-[#6B7280] text-sm rounded-lg hover:bg-[#F9FAFB] hover:text-[#374151] transition-colors flex items-center justify-center gap-2">
                        <UploadCloud className="w-4 h-4" />
                        Upload New Version
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
