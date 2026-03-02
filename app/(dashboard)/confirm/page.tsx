"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Loader2, ArrowLeft, Building2, DollarSign, Calendar, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContractData {
  fileName: string;
  fileUrl?: string;
  metadata: {
    contract_name: string;
    contract_type: string;
    amount: string | null;
    currency: string;
    effective_date: string;
    expiry_date: string;
    summary: string;
    party_a?: string;
    party_b?: string;
    governing_law?: string;
  };
}

const contractTypes = [
  "MSA",
  "NDA",
  "Employment",
  "Contractor",
  "Renewal",
  "Lease",
  "Service",
  "Partnership",
  "SaaS",
  "License",
  "Other"
];

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

export default function ConfirmPage() {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [editedData, setEditedData] = useState<ContractData["metadata"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Workspace state
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    // Fetch user workspaces
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok) {
          const data = await res.json();
          const wsList = Array.isArray(data) ? data : [];
          setWorkspaces(wsList);
          
          // Default to active workspace if available
          const saved = localStorage.getItem("activeWorkspaceId");
          if (saved && saved !== 'personal' && wsList.find((w: any) => w.id === saved)) {
            setSelectedWorkspaceId(saved);
          }
        }
      } catch (e) {
        console.error("Failed to fetch workspaces:", e);
      }
    };
    
    fetchWorkspaces();

    // Get uploaded contract data from localStorage
    const data = localStorage.getItem("uploadedContract");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setContractData(parsed);
        // Initialize editable data with defaults
        setEditedData({
          contract_name: parsed.metadata?.contract_name || parsed.fileName?.replace(/\.[^/.]+$/, "") || "",
          contract_type: parsed.metadata?.contract_type || "Other",
          amount: parsed.metadata?.amount || "",
          currency: parsed.metadata?.currency || "USD",
          effective_date: parsed.metadata?.effective_date || new Date().toISOString().split('T')[0],
          expiry_date: parsed.metadata?.expiry_date || "",
          summary: parsed.metadata?.summary || "",
          party_a: parsed.metadata?.party_a || "",
          party_b: parsed.metadata?.party_b || "",
          governing_law: parsed.metadata?.governing_law || "",
        });
      } catch (e) {
        console.error("Failed to parse contract data:", e);
      }
    }
    setLoading(false);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedData?.contract_name?.trim()) {
      newErrors.contract_name = "Contract name is required";
    }

    if (!editedData?.contract_type) {
      newErrors.contract_type = "Contract type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !editedData) return;

    setSaving(true);

    try {
      // Parse amount with NaN check
      let amount = null;
      if (editedData.amount) {
        const cleaned = editedData.amount.toString().replace(/[^\d.]/g, "");
        const parsed = cleaned ? parseFloat(cleaned) : null;
        amount = parsed && !isNaN(parsed) ? parsed : null;
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedData.contract_name,
          type: editedData.contract_type,
          amount: amount,
          currency: editedData.currency,
          effective_date: editedData.effective_date || null,
          expiry_date: editedData.expiry_date || null,
          summary: editedData.summary,
          file_url: contractData?.fileUrl,
          party_a: editedData.party_a,
          party_b: editedData.party_b,
          governing_law: editedData.governing_law,
          workspace_id: selectedWorkspaceId,
        }),
      });

      if (!res.ok) {
        // Try to parse error response
        let errorMessage = `Server error: ${res.status} ${res.statusText}`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.details || errorMessage;
            console.error('[Confirm] API Error:', errorData);
          } else {
            const text = await res.text();
            console.error('[Confirm] API Error (non-JSON):', text);
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error('[Confirm] Failed to parse error:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Clear localStorage
      localStorage.removeItem("uploadedContract");

      // Redirect to contracts list immediately
      window.location.href = "/contracts";
    } catch (error: any) {
      console.error('[Confirm] Save error:', error);
      alert(`Failed to save contract: ${error.message || "Unknown error"}`);
    } finally {
      // Always stop the saving spinner if the navigation hasn't kicked in
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ContractData["metadata"], value: string) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
    // Clear error when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!contractData || !editedData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10">
        <p className="text-[#737373] mb-4">No contract data found. Please upload a contract first.</p>
        <Button onClick={() => router.push("/upload")}>
          Upload Contract
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-8">
      <div className="max-w-[800px] mx-auto pb-24">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/upload")}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1A1A1A] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to upload
          </button>

          <div className="text-center">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
              Review Contract Details
            </h1>
            <p className="text-[15px] text-[#737373]">
              AI has extracted information from your document. Please review and edit as needed.
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#FEF3C7]/50 to-transparent">
            <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            <span className="font-semibold text-[#1A1A1A]">Contract Information</span>
            <span className="ml-auto text-sm text-[#9CA3AF]">All fields editable</span>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {/* Workspace Selection */}
            {workspaces.length > 0 && (
              <div className="mb-6 p-4 bg-[#F5EFE6] rounded-xl border border-[#E6DCCA]">
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-3">
                  <Building2 className="w-4 h-4 text-[#D97706]" />
                  Save to Workspace
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedWorkspaceId === null 
                      ? "bg-white border-[#F59E0B] shadow-sm ring-1 ring-[#F59E0B]" 
                      : "bg-white/50 border-[#E5E7EB] hover:bg-white"
                  }`}>
                    <input 
                      type="radio" 
                      name="workspace" 
                      className="hidden"
                      checked={selectedWorkspaceId === null}
                      onChange={() => setSelectedWorkspaceId(null)}
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      selectedWorkspaceId === null ? "bg-[#F59E0B] text-white" : "bg-gray-200 text-gray-500"
                    }`}>P</div>
                    <div>
                      <div className="text-sm font-medium text-[#1A1A1A]">Personal Space</div>
                      <div className="text-xs text-[#6B7280]">Only visible to you</div>
                    </div>
                  </label>
                  
                  {workspaces.map(ws => (
                    <label key={ws.id} className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedWorkspaceId === ws.id 
                        ? "bg-white border-[#F59E0B] shadow-sm ring-1 ring-[#F59E0B]" 
                        : "bg-white/50 border-[#E5E7EB] hover:bg-white"
                    }`}>
                      <input 
                        type="radio" 
                        name="workspace" 
                        className="hidden"
                        checked={selectedWorkspaceId === ws.id}
                        onChange={() => setSelectedWorkspaceId(ws.id)}
                      />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        selectedWorkspaceId === ws.id ? "bg-[#F59E0B] text-white" : "bg-gray-200 text-gray-500"
                      }`}>{ws.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="text-sm font-medium text-[#1A1A1A]">{ws.name}</div>
                        <div className="text-xs text-[#6B7280]">Shared with team</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                Contract Name *
              </label>
              <input
                type="text"
                value={editedData.contract_name}
                onChange={(e) => handleChange("contract_name", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all ${errors.contract_name ? "border-red-300 bg-red-50" : "border-[#E5E7EB]"
                  }`}
                placeholder="Enter contract name"
              />
              {errors.contract_name && (
                <p className="text-sm text-red-500 mt-1">{errors.contract_name}</p>
              )}
            </div>

            {/* Contract Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                Contract Type *
              </label>
              <select
                value={editedData.contract_type}
                onChange={(e) => handleChange("contract_type", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all bg-white ${errors.contract_type ? "border-red-300 bg-red-50" : "border-[#E5E7EB]"
                  }`}
              >
                {contractTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                  <Users className="w-4 h-4 text-[#9CA3AF]" />
                  Party A (You)
                </label>
                <input
                  type="text"
                  value={editedData.party_a || ""}
                  onChange={(e) => handleChange("party_a", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                  <Building2 className="w-4 h-4 text-[#9CA3AF]" />
                  Party B (Counterparty)
                </label>
                <input
                  type="text"
                  value={editedData.party_b || ""}
                  onChange={(e) => handleChange("party_b", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                  placeholder="Other party's name"
                />
              </div>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                  <DollarSign className="w-4 h-4 text-[#9CA3AF]" />
                  Contract Value
                </label>
                <input
                  type="text"
                  value={editedData.amount || ""}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Currency</label>
                <select
                  value={editedData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all bg-white"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                  <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                  Effective Date
                </label>
                <input
                  type="date"
                  value={editedData.effective_date || ""}
                  onChange={(e) => handleChange("effective_date", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                  <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editedData.expiry_date || ""}
                  onChange={(e) => handleChange("expiry_date", e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                  placeholder="Leave empty if indefinite"
                />
              </div>
            </div>

            {/* Governing Law */}
            <div>
              <label className="text-sm font-medium text-[#374151] mb-2 block">Governing Law / Jurisdiction</label>
              <input
                type="text"
                value={editedData.governing_law || ""}
                onChange={(e) => handleChange("governing_law", e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all"
                placeholder="e.g. Delaware, USA"
              />
            </div>

            {/* AI Summary */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#374151] mb-2">
                <FileText className="w-4 h-4 text-[#9CA3AF]" />
                AI Summary (Editable)
              </label>
              <textarea
                value={editedData.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-[14px] text-[#525252] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition-all resize-none"
                placeholder="Contract summary..."
              />
              <p className="text-xs text-[#9CA3AF] mt-2">
                This summary was generated by AI. You can edit it to better describe the contract.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 left-0 right-0 bg-[#F8F7F4] border-t border-[#E5E7EB] py-6 px-8 mt-8 -mx-8 z-50">
          <div className="max-w-[800px] mx-auto flex gap-3 justify-center">
            <Button
              variant="outline"
              className="px-8 py-3 h-auto border-[#E5E7EB] text-[#737373] hover:bg-[#F3F4F6] bg-white"
              onClick={() => router.push("/upload")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="px-8 py-3 h-auto bg-[#F59E0B] hover:bg-[#D97706] text-white font-medium duration-200 ease-in-out disabled:opacity-70"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm & Save Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
