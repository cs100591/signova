"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { UploadScanning } from "@/components/illustrations";

export default function ExtractingPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("your document");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Get filename from localStorage
    const data = localStorage.getItem("uploadedContract");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.fileName) {
          setFileName(parsed.fileName);
        }
      } catch (e) {
        console.error("Failed to parse uploaded contract data:", e);
      }
    }

    // Animate steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= 3) return prev;
        return prev + 1;
      });
    }, 800);

    // Redirect after processing
    const timer = setTimeout(() => {
      router.push("/confirm");
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
    };
  }, [router]);

  const steps = [
    { text: "Reading document structure", status: currentStep >= 0 ? "done" : "pending" },
    { text: "Identifying contract type", status: currentStep >= 1 ? "done" : "pending" },
    { text: "Extracting key dates and terms", status: currentStep >= 2 ? "done" : currentStep === 2 ? "current" : "pending" },
    { text: "Generating summary", status: currentStep >= 3 ? "done" : currentStep === 3 ? "current" : "pending" },
  ];

  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="bg-white rounded-[20px] border border-[#E6DCCA] p-12 w-full max-w-[480px] text-center">
        <div className="flex justify-center mb-6">
          <UploadScanning width={100} height={100} />
        </div>

        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">
          Extracting contract intelligence…
        </h2>

        <div className="space-y-4 mb-8 text-left">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {step.status === "done" && (
                <Check className="w-5 h-5 text-[#059669]" />
              )}
              {step.status === "current" && (
                <Loader2 className="w-5 h-5 text-[#F59E0B] animate-spin" />
              )}
              {step.status === "pending" && (
                <span className="w-2 h-2 rounded-full bg-[#E6DCCA]"></span>
              )}
              <span
                className={`text-[15px] ${
                  step.status === "current"
                    ? "text-[#B45309] font-medium"
                    : step.status === "done"
                    ? "text-[#525252]"
                    : "text-[#A3A3A3]"
                }`}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-[#737373] truncate max-w-[300px] mx-auto">{fileName}</p>
      </div>
    </div>
  );
}
