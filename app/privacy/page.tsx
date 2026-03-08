import Link from "next/link";
import { SignovaLogo } from "@/components/SignovaLogo";

export const metadata = {
  title: "Privacy Policy – Signova",
  description: "Signova Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#e0d9ce] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <SignovaLogo size={24} textClassName="text-base text-[#1a1714]" />
          </Link>
          <Link href="/login" className="text-sm text-[#7a7168] hover:text-[#1a1714]">
            Sign In
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1a1714] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#9a8f82] mb-10">Last updated: March 2026</p>

        <div className="prose prose-stone max-w-none space-y-8 text-[#3d3530]">

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">1. Information We Collect</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, upload contracts, or contact us for support. This includes your email address, password (stored as a hash), and any contract documents you upload for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">2. How We Use Your Information</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We use the information we collect to provide, maintain, and improve our services, including AI-powered contract analysis. Contract text is sent to our AI provider (Anthropic) for analysis and is not stored beyond the analysis session unless you choose to save the contract in your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">3. Data Storage and Security</h2>
            <p className="text-[#6b6560] leading-relaxed">
              Your data is stored securely using Supabase (PostgreSQL) with row-level security. Contract files are stored in encrypted cloud storage. We implement industry-standard security measures to protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">4. Sharing of Information</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We do not sell your personal information. We share your information only with trusted service providers necessary to operate our platform (such as our AI and infrastructure providers), and only to the extent necessary to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">5. Your Rights</h2>
            <p className="text-[#6b6560] leading-relaxed">
              You have the right to access, correct, or delete your personal information at any time. You may also request a copy of your data or withdraw consent for data processing. To exercise these rights, contact us at support@signova.me.
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">6. Cookies</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We use essential cookies to maintain your session and authentication state. We do not use tracking or advertising cookies. You may disable cookies in your browser settings, but this may affect the functionality of our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">7. Changes to This Policy</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">8. Contact Us</h2>
            <p className="text-[#6b6560] leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@signova.me" className="text-[#c8873a] hover:underline">support@signova.me</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#e0d9ce]">
          <Link href="/" className="text-sm text-[#9a8f82] hover:text-[#1a1714]">
            ← Back to Signova
          </Link>
        </div>
      </div>
    </div>
  );
}
