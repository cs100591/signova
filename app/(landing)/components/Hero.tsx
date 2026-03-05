"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 lg:pt-48 lg:pb-36 overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse,rgba(200,135,58,0.10)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center relative">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fdf3e3] border border-[#c8873a]/30 rounded-full text-xs font-medium text-[#c8873a] uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 bg-[#c8873a] rounded-full animate-pulse" />
          AI-Powered Contract Analysis
        </div>

        {/* H1 */}
        <h1 className="text-5xl lg:text-[4.5rem] font-serif tracking-tight leading-[1.08] text-[#1a1714] mb-6">
          AI that reads contracts
          <br />
          <em className="text-[#c8873a]">so you don&apos;t have to.</em>
        </h1>

        {/* Subheading */}
        <p className="text-lg lg:text-xl text-[#7a7168] max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload any contract — employment, NDA, lease, SaaS — and get instant risk analysis in plain language.
          Know exactly what you&apos;re signing before you sign it.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Link
            href="/login"
            className="group flex items-center gap-2 px-8 py-4 bg-[#c8873a] text-white rounded-xl text-base font-medium hover:bg-[#b3742f] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#c8873a]/20"
          >
            Analyze Your First Contract Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 px-8 py-4 border border-[#ddd5c8] bg-white/60 rounded-xl text-base font-medium hover:bg-white hover:border-[#1a1714] transition-all"
          >
            See How It Works ↓
          </a>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#7a7168]">
          {["Free to start", "No lawyer needed", "Results in 60 seconds"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="text-[#c8873a]">✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
