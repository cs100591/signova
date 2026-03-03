"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Plus, Loader2, FileText, Scan, Image, AlertCircle, RefreshCw, Users, FilePlus } from "lucide-react";
import { UploadIdle, UploadScanning } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { UploadConfetti } from "@/components/animations/UploadConfetti";
import PartySelectionModal from "@/components/PartySelectionModal";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("Uploading...");
  const [dragActive, setDragActive] = useState(false);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [quotaData, setQuotaData] = useState<{ current: number; limit: number } | null>(null);
  const [partyModal, setPartyModal] = useState<{ data: any; partyA: any; partyB: any; contractType: string | null; versionArgs?: any } | null>(null);
  const router = useRouter();

  // Detect file type and return appropriate status messages
  const getFileTypeInfo = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
      return {
        isImage: true,
        uploadText: "Uploading image...",
        processingText: "Reading scanned document...",
        icon: <Image className="w-12 h-12 text-[#F59E0B]" />,
      };
    }
    return {
      isImage: false,
      uploadText: "Uploading PDF...",
      processingText: "Extracting contract text...",
      icon: <FileText className="w-12 h-12 text-[#F59E0B]" />,
    };
  };

  const proceedToNextStep = (data: any, versionArgs?: any, selectedParty?: string) => {
    // Merge version args into metadata so confirm page can send them to API
    if (versionArgs) {
      data.metadata = { ...data.metadata, ...versionArgs };
    } else if (data.duplicateResult?.contractGroupId) {
      data.metadata = { ...data.metadata, contract_group_id: data.duplicateResult.contractGroupId, file_hash: data.duplicateResult.fileHash };
    }
    if (selectedParty) {
      data.selectedParty = selectedParty;
    }
    localStorage.setItem("uploadedContract", JSON.stringify(data));
    router.push("/extracting");
  };

  const extractPartiesAndShowModal = async (data: any, versionArgs?: any) => {
    try {
      const res = await fetch("/api/extract-parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: data.extractedText || "" }),
      });
      const parties = res.ok ? await res.json() : { party_a: null, party_b: null, contract_type: null };
      setPartyModal({ data, partyA: parties.party_a, partyB: parties.party_b, contractType: parties.contract_type, versionArgs });
    } catch {
      // If party extraction fails, proceed without modal
      proceedToNextStep(data, versionArgs);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading...");
    setDuplicateData(null);
    setContractData(null);
    
    const fileInfo = getFileTypeInfo(file);
    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Phase 1: Upload (0-30%)
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 30) return prev + 2;
          if (prev < 60) return prev + 1;
          return prev;
        });
      }, 100);
      
      // Add timeout to prevent hanging (45 seconds max for OCR)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (progressInterval) clearInterval(progressInterval);
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.error === 'CONTRACT_LIMIT_REACHED') {
          setQuotaData({ current: errorData.current, limit: errorData.limit });
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }
        throw new Error(errorData.details || errorData.error || "Upload failed");
      }
      
      const data = await res.json();
      
      // Phase 2: Processing (60-90%)
      setUploadProgress(60);
      setUploadStatus(data.isScanned ? "Reading scanned document with OCR..." : "Extracting contract text...");
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadProgress(80);
      setUploadStatus("Analyzing with AI...");
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setUploadProgress(100);
      
      if (data.duplicateResult && data.duplicateResult.type !== 'NONE') {
        setContractData(data);
        setDuplicateData(data.duplicateResult);
      } else {
        setTimeout(() => {
          extractPartiesAndShowModal(data);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      if (progressInterval) clearInterval(progressInterval);
      let errorMsg = error.message || "Upload failed. Please try again.";
      if (error.name === "AbortError") {
        errorMsg = "Upload timed out. The document processing is taking too long. Please try with a smaller or clearer file.";
      }
      alert(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("Uploading...");
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-full items-center justify-center p-10"
    >
      <UploadConfetti fire={uploadProgress >= 100 && !duplicateData} />

      {partyModal && (
        <PartySelectionModal
          partyA={partyModal.partyA}
          partyB={partyModal.partyB}
          contractType={partyModal.contractType}
          onSelect={(selectedParty: string) => {
            setPartyModal(null);
            proceedToNextStep(partyModal.data, partyModal.versionArgs, selectedParty);
          }}
          onClose={() => {
            setPartyModal(null);
            proceedToNextStep(partyModal.data, partyModal.versionArgs);
          }}
        />
      )}
      <div 
        className={`bg-white rounded-[20px] border-2 p-12 w-full max-w-[560px] text-center transition-all ${
          dragActive 
            ? "border-[#F59E0B] bg-[#FFFDF8]" 
            : "border-[#E6DCCA]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {quotaData ? (
          /* ── Storage limit reached ── */
          <div className="py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#fef3c7] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-[#d97706]" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1714] mb-2">Storage limit reached</h2>
            <p className="text-[#6b7280] text-sm mb-6">
              You&apos;ve used <strong className="text-[#1a1714]">{quotaData.current}/{quotaData.limit}</strong> contract slots on the Free plan.
              Upgrade to store more contracts.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-[#c8873a] hover:bg-[#b5762f] text-white"
                onClick={() => router.push('/settings/billing')}
              >
                Upgrade Plan →
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setQuotaData(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : duplicateData ? (
           <div className="py-4 text-left">
             {duplicateData.type === 'EXACT_MATCH' && (
               <>
                 <div className="flex items-center gap-2 text-red-600 mb-4">
                   <AlertCircle className="w-6 h-6" />
                   <h2 className="text-xl font-bold">Exact Duplicate Detected</h2>
                 </div>
                 <p className="text-gray-600 mb-6">{duplicateData.message}</p>
                 <div className="flex gap-4">
                   <Button variant="outline" className="w-full" onClick={() => router.push(`/contracts/${duplicateData.existingContractId}`)}>
                     View Existing
                   </Button>
                   <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706]" onClick={() => extractPartiesAndShowModal(contractData, { file_hash: duplicateData.fileHash, contract_group_id: duplicateData.contractGroupId })}>
                     Upload Anyway
                   </Button>
                 </div>
               </>
             )}
             {duplicateData.type === 'NEW_VERSION' && (
               <>
                 <div className="flex items-center gap-2 text-amber-500 mb-4">
                   <RefreshCw className="w-6 h-6" />
                   <h2 className="text-xl font-bold">New Version Detected</h2>
                 </div>
                 <p className="text-gray-600 mb-6">{duplicateData.message}</p>
                 <div className="flex flex-col gap-3">
                   <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706]" onClick={() => extractPartiesAndShowModal(contractData, { parent_contract_id: duplicateData.existingContractId, contract_group_id: duplicateData.contractGroupId, version: 2, file_hash: duplicateData.fileHash })}>
                     Save as New Version
                   </Button>
                   <Button variant="outline" className="w-full" onClick={() => extractPartiesAndShowModal(contractData, { contract_group_id: duplicateData.contractGroupId, file_hash: duplicateData.fileHash })}>
                     Upload Anyway
                   </Button>
                 </div>
               </>
             )}
             {duplicateData.type === 'SAME_PARTY' && (
               <>
                 <div className="flex items-center gap-2 text-blue-500 mb-4">
                   <Users className="w-6 h-6" />
                   <h2 className="text-xl font-bold">Same Party Detected</h2>
                 </div>
                 <p className="text-gray-600 mb-6">{duplicateData.message}</p>
                 <div className="flex gap-4">
                   <Button variant="outline" className="w-full" onClick={() => router.push('/contracts')}>
                     View All
                   </Button>
                   <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706]" onClick={() => extractPartiesAndShowModal(contractData, { contract_group_id: duplicateData.contractGroupId, file_hash: duplicateData.fileHash })}>
                     Continue Upload
                   </Button>
                 </div>
               </>
             )}
           </div>
        ) : isUploading ? (
          <div className="py-8">
            <div className="mb-6">
              <UploadScanning width={200} height={160} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">
              {uploadStatus}
            </h2>
            <p className="text-[15px] text-[#737373]">
              {uploadProgress < 60 
                ? "Uploading file to server..." 
                : uploadProgress < 80 
                  ? "Processing document content..."
                  : "AI is extracting contract details..."}
            </p>
            <div className="mt-6 w-full h-2 bg-[#F5EFE6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#F59E0B] transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#A3A3A3]">
              <span className={`w-2 h-2 rounded-full ${uploadProgress >= 30 ? "bg-green-500" : "bg-gray-300"}`} />
              Upload
              <span className={`w-2 h-2 rounded-full ${uploadProgress >= 60 ? "bg-green-500" : "bg-gray-300"}`} />
              Process
              <span className={`w-2 h-2 rounded-full ${uploadProgress >= 80 ? "bg-green-500" : "bg-gray-300"}`} />
              Extract
              <span className={`w-2 h-2 rounded-full ${uploadProgress >= 100 ? "bg-green-500" : "bg-gray-300"}`} />
              Complete
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <UploadIdle width={200} height={160} className="mx-auto" />
            </div>

            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-3">Upload your contract</h2>
            <p className="text-[15px] text-[#737373] mb-8 max-w-[400px] mx-auto">
              Drag and drop your PDF, image, or scanned document here
            </p>

            <label className="inline-flex items-center gap-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-xl px-8 py-4 font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Select File
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
              />
            </label>

            <div className="mt-6 space-y-2">
              <p className="text-sm text-[#A3A3A3]">
                Supports PDF, JPG, PNG, WEBP up to 20MB
              </p>
              <p className="text-xs text-[#737373] bg-[#F5EFE6] px-3 py-2 rounded-lg inline-block">
                📱 Phone photo? We&apos;ll use OCR to read it automatically
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
