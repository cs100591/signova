"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContractData {
  fileName: string;
  metadata: {
    contract_name: string;
    contract_type: string;
    amount: string | null;
    effective_date: string;
    expiry_date: string;
    summary: string;
  };
}

export default function ConfirmPage() {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get uploaded contract data from localStorage
    const data = localStorage.getItem("uploadedContract");
    if (data) {
      setContractData(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: 1,
          name: contractData?.metadata.contract_name,
          type: contractData?.metadata.contract_type,
          amount: contractData?.metadata.amount,
          effective_date: contractData?.metadata.effective_date,
          expiry_date: contractData?.metadata.expiry_date,
          summary: contractData?.metadata.summary,
          file_url: contractData?.fileName,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      // Clear localStorage
      localStorage.removeItem("uploadedContract");
      
      router.push("/contracts");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save contract. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10">
        <p className="text-[#737373] mb-4">No contract data found</p>
        <Button onClick={() => router.push("/upload")}>
          Upload Contract
        </Button>
      </div>
    );
  }

  const { metadata } = contractData;

  return (
    <div className="flex h-full flex-col items-center justify-center p-10">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold text-[#1A1A1A] mb-2">
          Review extracted information
        </h1>
        <p className="text-[15px] text-[#737373]">
          AI has extracted the following details. Please review and confirm.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6DCCA] w-full max-w-[560px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#F5EFE6]">
          <Sparkles className="w-5 h-5 text-[#F59E0B]" />
          <span className="font-semibold text-[#1A1A1A]">AI Extraction Results</span>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">Contract Name</label>
            <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[15px] text-[#1A1A1A]">
              {metadata.contract_name}
            </div>
          </div>

          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">Contract Type</label>
            <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[15px] text-[#1A1A1A]">
              {metadata.contract_type}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#737373] mb-1.5 block">Amount</label>
              <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[15px] text-[#1A1A1A]">
                {metadata.amount || "—"}
              </div>
            </div>
            <div>
              <label className="text-sm text-[#737373] mb-1.5 block">Effective Date</label>
              <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[15px] text-[#1A1A1A]">
                {metadata.effective_date}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">Expiry Date</label>
            <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[15px] text-[#1A1A1A]">
              {metadata.expiry_date}
            </div>
          </div>

          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">AI Summary</label>
            <div className="px-4 py-3 border border-[#E6DCCA] rounded-xl text-[14px] text-[#525252] leading-relaxed">
              {metadata.summary}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          className="px-6 py-2.5 h-auto border-[#E6DCCA] text-[#737373] hover:bg-[#F5EFE6]"
          onClick={() => router.push("/upload")}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          className="px-7 py-2.5 h-auto bg-[#F59E0B] hover:bg-[#D97706] text-white"
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
              Save Contract
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
