"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

export default function ExtractingPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/confirm");
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  const steps = [
    { text: "Reading document structure", status: "done" },
    { text: "Identifying contract type", status: "done" },
    { text: "Extracting key dates and terms", status: "current" },
    { text: "Generating summary", status: "pending" },
  ];

  return (
    <div className="flex h-full items-center justify-center p-10">
      <div className="bg-white rounded-[20px] border border-[#E6DCCA] p-12 w-full max-w-[480px] text-center">
        <div className="w-[72px] h-[72px] rounded-2xl bg-[#FEF3C7] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✨</span>
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

        <p className="text-sm text-[#737373]">Service-Agreement-Acme.pdf</p>
      </div>
    </div>
  );
}
