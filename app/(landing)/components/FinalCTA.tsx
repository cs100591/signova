import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="py-24 lg:py-32 bg-[#1a1714] text-[#f5f0e8]">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-3xl lg:text-5xl font-serif mb-6 leading-tight">
          Stop signing contracts<br />you don&apos;t understand.
        </h2>
        <p className="text-lg text-[#7a7168] mb-10 max-w-xl mx-auto leading-relaxed">
          Join thousands of freelancers, founders, and professionals who use Signova to protect themselves.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-10 py-4 bg-[#c8873a] text-white rounded-xl text-lg font-medium hover:bg-[#b3742f] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#c8873a]/20"
        >
          Analyze Your First Contract Free
          <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="mt-5 text-sm text-[#7a7168]">Free plan · No credit card required</p>
      </div>
    </section>
  );
}
