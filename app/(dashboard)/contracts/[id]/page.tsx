"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  CheckCircle2,
  XCircle,
  Loader2,
  FileDown
} from "lucide-react";
import ExportPDFButton from "@/components/export-pdf-button";
import { ContractAnalysis } from "@/lib/pdf-export";
import { RiskLow, RiskMedium, RiskHigh, AnalysisComplete } from "@/components/illustrations";

interface Contract {
  id: number;
  name: string;
  type: string;
  description: string;
  value: string;
  currency: string;
  effectiveDate: string;
  expiryDate: string | null;
  partyA: string;
  partyB: string;
  governingLaw: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'indefinite';
  summary: string;
  riskScore?: number;
  fileUrl?: string;
}

// Mock analysis data for demonstration
const mockAnalysisData: Record<number, ContractAnalysis> = {
  1: {
    contractName: "Acme Corp MSA",
    contractType: "MSA",
    riskScore: 72,
    verdict: "High risk due to broad liability limitation and auto-renewal clauses",
    findings: [
      {
        category: "Liability",
        severity: "HIGH",
        title: "Excessive Liability Cap",
        issue: "The liability cap is limited to 12 months of fees, which is unusually low for enterprise software.",
        quote: "Company's total liability shall not exceed the total amount paid by Customer in the 12 months preceding the claim.",
        explanation: "This cap may not cover actual damages in case of data breach or service failure. Industry standard is typically 2-3x annual fees.",
        suggestion: "Negotiate liability cap to 24-36 months of fees or $500,000, whichever is greater."
      },
      {
        category: "Termination",
        severity: "MEDIUM",
        title: "Auto-Renewal Without Notice",
        issue: "Contract auto-renews without requiring explicit confirmation.",
        quote: "This Agreement shall automatically renew for successive one-year terms unless either party provides 60 days notice.",
        explanation: "You must actively monitor expiry dates and remember to cancel, or you'll be locked in for another year.",
        suggestion: "Request removal of auto-renewal clause or require affirmative consent for renewal."
      }
    ],
    missing: [
      "Data breach notification timeline",
      "Service level agreement (SLA) with penalties",
      "Data deletion procedure upon termination"
    ],
    summary: [
      "Liability limitation is too low for enterprise software ($120K/year contract)",
      "Auto-renewal requires active monitoring to avoid unwanted extension",
      "Consider negotiating these terms before signing"
    ],
    analyzedAt: new Date().toISOString()
  },
  2: {
    contractName: "Dunder Mifflin Renewal",
    contractType: "Renewal",
    riskScore: 45,
    verdict: "Moderate risk - price increase needs evaluation",
    findings: [
      {
        category: "Payment",
        severity: "MEDIUM",
        title: "15% Price Increase Without Justification",
        issue: "Annual price increase of 15% is above inflation and market rates.",
        quote: "Pricing for the renewal term shall increase by 15% over the prior term.",
        explanation: "Typical annual increases are 3-5%. 15% significantly exceeds market norms for paper supplies.",
        suggestion: "Negotiate cap on annual increases at 5% or request justification for 15%."
      }
    ],
    missing: [
      "Volume commitment flexibility",
      "Price protection for multi-year terms"
    ],
    summary: [
      "15% price increase is unusually high",
      "60-day cancellation notice requires advance planning",
      "Consider shopping for alternative suppliers"
    ],
    analyzedAt: new Date().toISOString()
  },
  3: {
    contractName: "Stark Industries NDA",
    contractType: "NDA",
    riskScore: 25,
    verdict: "Low risk - standard mutual NDA terms",
    findings: [],
    missing: [
      "Return/destruction procedure for confidential materials"
    ],
    summary: [
      "Standard mutual NDA with reasonable terms",
      "Perpetual confidentiality is typical for trade secrets",
      "Safe to sign as-is"
    ],
    analyzedAt: new Date().toISOString()
  }
};

const mockContracts: Record<number, Contract> = {
  1: {
    id: 1,
    name: "Acme Corp MSA",
    type: "MSA",
    description: "Master Service Agreement for Q3 enterprise software deliverables covering all technical specifications and service level agreements.",
    value: "$120,000",
    currency: "USD",
    effectiveDate: "2024-01-15",
    expiryDate: "2024-12-15",
    partyA: "Signova Inc.",
    partyB: "Acme Corporation",
    governingLaw: "Delaware, USA",
    status: "active",
    summary: "Master service agreement for enterprise software delivery. Includes SLA guarantees, payment terms of net 30, and automatic renewal clauses. Key risks identified in liability limitation section.",
    riskScore: 72,
    fileUrl: "/uploads/acme-msa.pdf"
  },
  2: {
    id: 2,
    name: "Dunder Mifflin Renewal",
    type: "Renewal",
    description: "Annual paper supply contract renewal with updated pricing terms and volume discounts.",
    value: "$45,000",
    currency: "USD",
    effectiveDate: "2024-01-01",
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    partyA: "Signova Inc.",
    partyB: "Dunder Mifflin Paper Co.",
    governingLaw: "Pennsylvania, USA",
    status: "expiring_soon",
    summary: "Annual renewal with 15% price increase. Auto-renewal clause requires 60-day notice to cancel.",
    riskScore: 45,
  },
  3: {
    id: 3,
    name: "Stark Industries NDA",
    type: "NDA",
    description: "Non-disclosure agreement for project \"Iron Legion\". Strict confidentiality clauses applied.",
    value: "N/A",
    currency: "",
    effectiveDate: "2024-03-01",
    expiryDate: null,
    partyA: "Signova Inc.",
    partyB: "Stark Industries",
    governingLaw: "New York, USA",
    status: "indefinite",
    summary: "Standard mutual NDA with perpetual confidentiality obligations. No significant risks identified.",
    riskScore: 25,
  },
};

const getStatusBadge = (status: Contract['status'], daysLeft?: number) => {
  switch (status) {
    case 'expired':
      return { 
        color: "bg-red-100 text-red-700 border-red-200", 
        label: "Expired",
        icon: XCircle 
      };
    case 'expiring_soon':
      return {
        color: "bg-orange-100 text-orange-700 border-orange-200",
        label: daysLeft !== undefined && daysLeft <= 7 ? `Exp: ${daysLeft} days` : `Exp: ${daysLeft ?? '?'} days`,
        icon: AlertCircle
      };
    case 'indefinite':
      return { 
        color: "bg-blue-100 text-blue-700 border-blue-200", 
        label: "Indefinite",
        icon: CheckCircle2 
      };
    default:
      return { 
        color: "bg-green-100 text-green-700 border-green-200", 
        label: "Active",
        icon: CheckCircle2 
      };
  }
};

const getRiskColor = (score: number) => {
  if (score <= 40) return "text-green-600";
  if (score <= 70) return "text-yellow-600";
  return "text-red-600";
};

const getRiskBg = (score: number) => {
  if (score <= 40) return "bg-green-100";
  if (score <= 70) return "bg-yellow-100";
  return "bg-red-100";
};

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = Number(params.id);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setContract(mockContracts[contractId] || null);
      setLoading(false);
    }, 500);
  }, [contractId]);

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
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Contract not found</h2>
          <Link href="/contracts" className="text-[#F59E0B] hover:underline">
            Back to contracts
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(contract.status);
  const daysLeft = contract.expiryDate 
    ? Math.ceil((new Date(contract.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
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
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">{contract.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded">
                    {contract.type}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusBadge.color}`}>
                    {contract.status === 'expiring_soon' && daysLeft !== undefined
                      ? `Exp: ${daysLeft} days`
                      : statusBadge.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/terminal?contract=${contract.id}`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FEF3C7] text-[#B45309] rounded-lg text-sm font-medium hover:bg-[#FDE68A] transition-colors">
                  <Bot className="w-4 h-4" />
                  Analyze with AI
                </button>
              </Link>
              
              <button className="p-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <Edit3 className="w-4 h-4 text-[#6B7280]" />
              </button>
              
              <button className="p-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <Download className="w-4 h-4 text-[#6B7280]" />
              </button>
              
              <button className="p-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <Archive className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6">
            {['overview', 'document', 'analysis', 'history'].map((tab) => (
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
          {/* Left Column - Document */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-3">Summary</h3>
                  <p className="text-[15px] text-[#525252] leading-relaxed">{contract.summary}</p>
                </div>

                {/* Key Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#D97706]" />
                      </div>
                      <span className="text-sm text-[#6B7280]">Parties</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-[#1A1A1A]">{contract.partyA}</p>
                      <p className="text-sm text-[#6B7280]">→ {contract.partyB}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#D97706]" />
                      </div>
                      <span className="text-sm text-[#6B7280]">Contract Value</span>
                    </div>
                    <p className="font-medium text-[#1A1A1A]">{contract.value}</p>
                    <p className="text-sm text-[#6B7280]">{contract.currency || 'USD'}</p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#D97706]" />
                      </div>
                      <span className="text-sm text-[#6B7280]">Effective Date</span>
                    </div>
                    <p className="font-medium text-[#1A1A1A]">{new Date(contract.effectiveDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>

                  <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                        <Scale className="w-5 h-5 text-[#D97706]" />
                      </div>
                      <span className="text-sm text-[#6B7280]">Governing Law</span>
                    </div>
                    <p className="font-medium text-[#1A1A1A]">{contract.governingLaw}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'document' && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-8 min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#6B7280] mb-4">PDF preview will be displayed here</p>
                  <button className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706]">
                    Download PDF
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div>
                {(() => {
                  const analysis = mockAnalysisData[contract.id];
                  if (!analysis) {
                    return (
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-8">
                        <div className="text-center py-12">
                          <div className="mb-6">
                            <AnalysisComplete width={180} height={180} className="mx-auto" />
                          </div>
                          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No analysis yet</h3>
                          <p className="text-[#6B7280] mb-6">Run AI analysis to identify risks and get improvement suggestions</p>
                          <Link href={`/terminal?contract=${contract.id}`}>
                            <button className="px-6 py-3 bg-[#F59E0B] text-white rounded-xl font-medium hover:bg-[#D97706]">
                              Start AI Analysis
                            </button>
                          </Link>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Analysis Header with Export */}
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[#1A1A1A]">AI Analysis Results</h3>
                          <ExportPDFButton 
                            analysis={analysis} 
                            variant="secondary" 
                            size="sm" 
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-lg">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            analysis.riskScore <= 40 ? 'bg-green-100' : 
                            analysis.riskScore <= 70 ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <span className={`text-2xl font-bold ${
                              analysis.riskScore <= 40 ? 'text-green-600' : 
                              analysis.riskScore <= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {analysis.riskScore}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">
                              {analysis.riskScore <= 40 ? 'Low Risk' : 
                               analysis.riskScore <= 70 ? 'Medium Risk' : 'High Risk'}
                            </p>
                            <p className="text-sm text-[#6B7280]">{analysis.verdict}</p>
                          </div>
                        </div>
                      </div>

                      {/* Findings */}
                      {analysis.findings.length > 0 && (
                        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                          <h3 className="font-semibold text-[#1A1A1A] mb-4">
                            Risk Findings ({analysis.findings.length})
                          </h3>
                          <div className="space-y-4">
                            {analysis.findings.map((finding, index) => (
                              <div key={index} className="border border-[#E5E7EB] rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    finding.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                                    finding.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                    finding.severity === 'LOW' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {finding.severity}
                                  </span>
                                  <span className="text-xs text-[#6B7280]">{finding.category}</span>
                                </div>
                                <h4 className="font-medium text-[#1A1A1A] mb-2">{finding.title}</h4>
                                <p className="text-sm text-[#6B7280] mb-3">{finding.issue}</p>
                                {finding.quote && (
                                  <blockquote className="text-xs text-[#9CA3AF] italic border-l-2 border-[#E5E7EB] pl-3 mb-3">
                                    "{finding.quote}"
                                  </blockquote>
                                )}
                                <p className="text-sm text-[#525252]">{finding.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Protections */}
                      {analysis.missing.length > 0 && (
                        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                          <h3 className="font-semibold text-[#1A1A1A] mb-4">Missing Protections</h3>
                          <ul className="space-y-2">
                            {analysis.missing.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-[#6B7280]">
                                <span className="text-gray-400">⚫</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Executive Summary */}
                      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                        <h3 className="font-semibold text-[#1A1A1A] mb-4">Executive Summary</h3>
                        <ul className="space-y-3">
                          {analysis.summary.map((point, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-[#525252]">
                              <span className="text-[#F59E0B] mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-xs text-[#9CA3AF] text-center">
                        ⚠️ Signova analysis is for informational purposes only and does not constitute legal advice.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Risk Score Card */}
            {contract.riskScore !== undefined && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">Risk Assessment</h3>
                
                <div className="flex items-center justify-center mb-4">
                  {contract.riskScore <= 40 ? (
                    <RiskLow width={120} height={120} />
                  ) : contract.riskScore <= 70 ? (
                    <RiskMedium width={120} height={120} />
                  ) : (
                    <RiskHigh width={120} height={120} />
                  )}
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className={`text-3xl font-bold ${getRiskColor(contract.riskScore)}`}>
                      {contract.riskScore}
                    </span>
                    <span className="text-lg text-[#9CA3AF]">/100</span>
                  </div>
                  <p className={`font-medium ${getRiskColor(contract.riskScore)}`}>
                    {contract.riskScore <= 40 ? '✅ Low Risk' : contract.riskScore <= 70 ? '⚠️ Medium Risk' : '🔴 High Risk'}
                  </p>
                  <p className="text-sm text-[#6B7280] mt-1">Based on AI analysis</p>
                </div>

                <Link href={`/terminal?contract=${contract.id}`}>
                  <button className="w-full mt-4 px-4 py-2.5 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#D97706] transition-colors">
                    View Full Analysis
                  </button>
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left">
                  <Edit3 className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm text-[#374151]">Edit Contract</span>
                </button>
                
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left">
                  <Download className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm text-[#374151]">Download PDF</span>
                </button>
                
                {mockAnalysisData[contract.id] && (
                  <div className="w-full">
                    <ExportPDFButton 
                      analysis={mockAnalysisData[contract.id]} 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start px-4 py-3 h-auto"
                    />
                  </div>
                )}
                
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left">
                  <Archive className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm text-[#374151]">Archive</span>
                </button>
                
                <hr className="border-[#E5E7EB]" />
                
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Delete Contract</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
