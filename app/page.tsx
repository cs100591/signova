"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Menu,
  X,
  Upload,
  Bot,
  AlertTriangle,
  FileCheck
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1a1714] font-sans">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#f5f0e8]/95 backdrop-blur-md border-b border-[#ddd5c8]" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-serif tracking-tight">Signova</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
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
                className="px-5 py-2.5 bg-[#1a1714] text-[#f5f0e8] rounded-lg text-sm font-medium hover:bg-[#2e2a26] transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#f5f0e8] border-t border-[#ddd5c8] px-6 py-4"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-[#7a7168]">Features</a>
              <a href="#pricing" className="text-sm text-[#7a7168]">Pricing</a>
              <Link href="/login" className="text-sm text-[#7a7168]">Sign In</Link>
              <Link 
                href="/login" 
                className="px-5 py-2.5 bg-[#1a1714] text-[#f5f0e8] rounded-lg text-sm font-medium text-center"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(200,135,58,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#fdf3e3] border border-[#c8873a]/30 rounded-full text-xs font-medium text-[#c8873a] uppercase tracking-wider mb-8"
          >
            <span className="w-1.5 h-1.5 bg-[#c8873a] rounded-full animate-pulse" />
            AI Contract Analysis
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl lg:text-7xl font-serif tracking-tight leading-[1.1] max-w-4xl mx-auto mb-6"
          >
            Understand contracts before you <em className="text-[#c8873a]">sign</em>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg lg:text-xl text-[#7a7168] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            AI-powered contract analysis that identifies risks, explains terms in plain English, and suggests improvements — in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/login"
              className="group flex items-center gap-2 px-8 py-4 bg-[#1a1714] text-[#f5f0e8] rounded-xl text-base font-medium hover:bg-[#2e2a26] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#1a1714]/10"
            >
              Upload Your Contract
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#how-it-works"
              className="flex items-center gap-2 px-8 py-4 border border-[#ddd5c8] rounded-xl text-base font-medium hover:bg-white hover:border-[#1a1714] transition-all"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-sm text-[#7a7168]"
          >
            Free for first 3 contracts • No credit card required
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif mb-4">How Signova helps you</h2>
            <p className="text-[#7a7168] max-w-xl mx-auto">From upload to insight in under 60 seconds</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Upload Any Contract",
                description: "PDFs, images, or scanned documents. Our OCR handles it all.",
              },
              {
                icon: Bot,
                title: "AI Analysis",
                description: "Claude AI identifies risks, unfair terms, and missing protections.",
              },
              {
                icon: FileCheck,
                title: "Actionable Insights",
                description: "Get a risk score, plain-English explanations, and suggested rewrites.",
              },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl border border-[#ddd5c8] hover:border-[#c8873a]/50 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[#fdf3e3] flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#c8873a]" />
                </div>
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-[#7a7168] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif mb-4">How it works</h2>
            <p className="text-[#7a7168]">Three simple steps to contract confidence</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-[#ddd5c8]" />

            {[
              {
                step: "1",
                title: "Upload",
                description: "Drag and drop your contract. We support PDFs, images, and scans.",
              },
              {
                step: "2",
                title: "Analyze",
                description: "Our AI reads every clause, identifies risks, and compares to industry standards.",
              },
              {
                step: "3",
                title: "Decide",
                description: "Review your risk score, understand issues, and negotiate with confidence.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-[#1a1714] text-[#f5f0e8] flex items-center justify-center text-lg font-medium mx-auto mb-6 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-xl font-medium mb-3">{item.title}</h3>
                <p className="text-[#7a7168]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Risk Detection", desc: "Identifies high-risk clauses before you sign" },
              { icon: Clock, title: "Expiry Alerts", desc: "Never miss a contract renewal deadline" },
              { icon: Sparkles, title: "AI Suggestions", desc: "Get better terms with suggested rewrites" },
              { icon: FileText, title: "Secure Storage", desc: "All contracts encrypted and stored safely" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <item.icon className="w-8 h-8 text-[#c8873a] mx-auto mb-4" />
                <h3 className="font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-[#7a7168]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif mb-4">Simple, transparent pricing</h2>
            <p className="text-[#7a7168]">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                features: ["3 contracts", "3 AI analyses", "Basic risk scoring"],
                cta: "Get Started",
                popular: false,
              },
              {
                name: "Solo",
                price: "$9.9",
                period: "/month",
                features: ["50 contracts", "30 AI analyses/month", "Email alerts"],
                cta: "Start Free Trial",
                popular: true,
              },
              {
                name: "Pro",
                price: "$29",
                period: "/month",
                features: ["Unlimited contracts", "100 AI analyses/month", "Priority support"],
                cta: "Start Free Trial",
                popular: false,
              },
            ].map((plan, i) => (
              <div 
                key={i}
                className={`relative p-8 rounded-2xl ${
                  plan.popular 
                    ? "bg-[#1a1714] text-[#f5f0e8] border-2 border-[#c8873a]" 
                    : "bg-white border border-[#ddd5c8]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#c8873a] text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-serif">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-[#7a7168]" : "text-[#7a7168]"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle className={`w-4 h-4 ${plan.popular ? "text-[#c8873a]" : "text-[#c8873a]"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/login"
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-all ${
                    plan.popular 
                      ? "bg-[#c8873a] text-white hover:bg-[#b3742f]" 
                      : "bg-[#1a1714] text-[#f5f0e8] hover:bg-[#2e2a26]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-[#1a1714] text-[#f5f0e8]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl lg:text-5xl font-serif mb-6">
            Stop signing contracts you don&apos;t understand
          </h2>
          <p className="text-lg text-[#7a7168] mb-10 max-w-2xl mx-auto">
            Join thousands of freelancers and small business owners who use Signova to protect themselves.
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#c8873a] text-white rounded-xl text-lg font-medium hover:bg-[#b3742f] transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-[#7a7168]">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#ddd5c8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-xl font-serif">Signova</span>
            <p className="text-sm text-[#7a7168]">
              © 2026 Signova. AI contract analysis for everyone.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-[#7a7168] hover:text-[#1a1714]">Privacy</a>
              <a href="#" className="text-sm text-[#7a7168] hover:text-[#1a1714]">Terms</a>
              <a href="#" className="text-sm text-[#7a7168] hover:text-[#1a1714]">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
