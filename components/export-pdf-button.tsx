"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportAnalysisToPDF, ContractAnalysis } from "@/lib/pdf-export";

interface ExportPDFButtonProps {
  analysis: ContractAnalysis;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ExportPDFButton({ 
  analysis, 
  variant = "secondary",
  size = "md",
  className = ""
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAnalysisToPDF(analysis);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const baseStyles = "flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[#1A1A1A] text-white hover:bg-[#333]",
    secondary: "border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F3F4F6]",
    ghost: "text-[#6B7280] hover:text-[#374151] hover:bg-[#F3F4F6]"
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl"
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export PDF Report</span>
        </>
      )}
    </button>
  );
}
