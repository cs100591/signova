import Link from "next/link";
import { SignovaLogo } from "@/components/SignovaLogo";

export const metadata = {
  title: "Terms of Service – Signova",
  description: "Signova Terms of Service",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-[#1a1714] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#9a8f82] mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-[#3d3530]">

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#6b6560] leading-relaxed">
              By accessing or using Signova ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">2. Description of Service</h2>
            <p className="text-[#6b6560] leading-relaxed">
              Signova provides AI-powered contract analysis tools for informational purposes only. The Service does not provide legal advice and is not a substitute for consultation with a qualified legal professional.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">3. Not Legal Advice</h2>
            <p className="text-[#6b6560] leading-relaxed">
              The analysis, risk scores, and suggestions provided by Signova are for informational purposes only and do not constitute legal advice. You should consult a qualified attorney before making any legal decisions based on information provided by the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">4. User Responsibilities</h2>
            <p className="text-[#6b6560] leading-relaxed">
              You are responsible for ensuring you have the right to upload and analyze any contracts you submit to the Service. You must not upload contracts that contain confidential information of third parties without their consent. You agree to use the Service only for lawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">5. Intellectual Property</h2>
            <p className="text-[#6b6560] leading-relaxed">
              You retain ownership of any contracts you upload. By uploading content, you grant Signova a limited license to process the content for the purpose of providing the analysis service. Signova retains all rights to its platform, technology, and AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">6. Subscriptions and Payments</h2>
            <p className="text-[#6b6560] leading-relaxed">
              Paid plans are billed on a monthly or annual basis. You may cancel your subscription at any time. Refunds are provided at our discretion. We reserve the right to change pricing with reasonable notice to subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">7. Limitation of Liability</h2>
            <p className="text-[#6b6560] leading-relaxed">
              To the maximum extent permitted by law, Signova shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid for the Service in the past 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">8. Termination</h2>
            <p className="text-[#6b6560] leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may close your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">9. Governing Law</h2>
            <p className="text-[#6b6560] leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#1a1714] mb-3">10. Contact</h2>
            <p className="text-[#6b6560] leading-relaxed">
              For questions about these Terms, please contact us at{" "}
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
