import Link from "next/link";
import { SignovaLogo } from "@/components/SignovaLogo";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e0d9ce] py-14">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <SignovaLogo size={28} textClassName="text-lg text-[#1a1714]" />
            <p className="text-sm text-[#7a7168] mt-3 leading-relaxed">
              AI contract analysis for everyone.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-[#1a1714] uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "How it works", href: "#how-it-works" },
                { label: "FAQ", href: "#faq" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[#1a1714] uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-[#1a1714] uppercase tracking-widest mb-4">Account</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/login" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-[#7a7168] hover:text-[#1a1714] transition-colors">
                  Get Started Free
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e0d9ce] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#9a8f82]">
          <span>© 2026 Signova. All rights reserved.</span>
          <span>Not legal advice. For informational purposes only.</span>
        </div>
      </div>
    </footer>
  );
}
