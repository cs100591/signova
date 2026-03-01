"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Plus, Loader2, FileText, Scan, Image } from "lucide-react";
import { UploadIdle, UploadScanning } from "@/components/illustrations";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("Uploading...");
  const [dragActive, setDragActive] = useState(false);
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

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading...");
    
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
      
      // Store metadata in localStorage for confirm page
      localStorage.setItem("uploadedContract", JSON.stringify(data));
      
      // Small delay to show 100% progress
      setTimeout(() => {
        router.push("/extracting");
      }, 500);
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
        {isUploading ? (
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
                accept="application/pdf,image/jpeg,image/png,image/webp"
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
