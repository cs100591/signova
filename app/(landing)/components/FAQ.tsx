"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Do I need a lawyer to use Signova?",
    a: "No. Signova is designed for non-lawyers. We explain every finding in plain language so you can understand your contract without legal expertise.",
  },
  {
    q: "Is my contract data secure?",
    a: "Yes. Contracts are encrypted and stored securely. We never share your data with third parties.",
  },
  {
    q: "What types of contracts does Signova support?",
    a: "Employment, NDA, freelance, lease, SaaS, vendor, service agreements, and more. If it's a contract, Signova can analyze it.",
  },
  {
    q: "Is Signova a substitute for legal advice?",
    a: "Signova is an AI assistant, not a licensed lawyer. For high-stakes contracts, we recommend consulting a lawyer. Signova helps you understand what questions to ask.",
  },
  {
    q: "How accurate is the AI analysis?",
    a: "Our AI engine extracts data, applies deterministic risk rules, and generates narrative explanations. It identifies common risk patterns with high accuracy, though complex legal nuances may require human review.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 lg:py-32 bg-[#f5f0e8]">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1714] mb-3">Common questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-[#e0d9ce] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#fdfaf7] transition-colors"
              >
                <span className="font-medium text-sm text-[#1a1714] pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#9a8f82] flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-[#7a7168] leading-relaxed border-t border-[#f0ede8] pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
