import type { Metadata } from "next";
import Navbar from "./(landing)/components/Navbar";
import Hero from "./(landing)/components/Hero";
import SocialProof from "./(landing)/components/SocialProof";
import HowItWorks from "./(landing)/components/HowItWorks";
import Features from "./(landing)/components/Features";
import ContractTypes from "./(landing)/components/ContractTypes";
import RiskDemo from "./(landing)/components/RiskDemo";
import Pricing from "./(landing)/components/Pricing";
import FAQ from "./(landing)/components/FAQ";
import FinalCTA from "./(landing)/components/FinalCTA";
import Footer from "./(landing)/components/Footer";

export const metadata: Metadata = {
  title: "Signova — AI Contract Analysis | Review Any Contract in Minutes",
  description:
    "Upload any contract and get instant AI risk analysis. Know your risks, understand every clause, and negotiate with confidence. Free to start — no lawyer needed.",
  keywords: [
    "AI contract review",
    "contract analysis tool",
    "contract risk checker",
    "review contract online",
    "AI legal assistant",
    "contract review without lawyer",
    "freelance contract checker",
    "employment contract analysis",
    "NDA review tool",
    "contract red flags",
  ],
  openGraph: {
    title: "Signova — AI Contract Analysis",
    description: "Know your contract risks before you sign. AI-powered analysis in minutes.",
    url: "https://signova.me",
    siteName: "Signova",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Signova — AI Contract Analysis",
    description: "Know your contract risks before you sign.",
  },
  alternates: {
    canonical: "https://signova.me",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Signova",
  description: "AI-powered contract analysis tool",
  url: "https://signova.me",
  applicationCategory: "LegalApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI contract risk analysis",
    "Contract storage",
    "Plain language explanations",
    "Negotiation suggestions",
    "Expiry tracking",
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#f5f0e8] text-[#1a1714] font-sans">
        <Navbar />
        <main>
          <Hero />
          <SocialProof />
          <HowItWorks />
          <Features />
          <ContractTypes />
          <RiskDemo />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
