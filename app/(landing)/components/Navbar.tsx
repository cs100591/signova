"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignovaLogo } from "@/components/SignovaLogo";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#e0d9ce] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-18 py-4">
          <Link href="/" className="flex items-center gap-2">
            <SignovaLogo size={32} textClassName="text-xl text-[#1a1714]" />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
              Pricing
            </a>
            <Link href="/login" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-[#c8873a] text-white rounded-lg text-sm font-medium hover:bg-[#b3742f] transition-all"
            >
              Get Started Free →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#e0d9ce] px-6 py-5 flex flex-col gap-4">
          <a href="#how-it-works" className="text-sm text-[#7a7168]" onClick={() => setMobileOpen(false)}>How It Works</a>
          <a href="#features" className="text-sm text-[#7a7168]" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" className="text-sm text-[#7a7168]" onClick={() => setMobileOpen(false)}>Pricing</a>
          <Link href="/login" className="text-sm text-[#7a7168]">Sign In</Link>
          <Link
            href="/login"
            className="px-5 py-3 bg-[#c8873a] text-white rounded-lg text-sm font-medium text-center"
          >
            Get Started Free →
          </Link>
        </div>
      )}
    </nav>
  );
}
