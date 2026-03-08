import Link from "next/link";
import { CheckCircle } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 contracts stored",
      "3 AI analyses",
      "1 AI comparison",
      "Core risk analysis",
    ],
    cta: "Get Started Free",
    href: "/login",
    popular: false,
  },
  {
    name: "Solo",
    price: "$9.9",
    period: "/month",
    features: [
      "50 contracts",
      "25 AI analyses/month",
      "3 AI comparisons/month",
      "Expiry email alerts",
    ],
    cta: "Start Free Trial",
    href: "/login",
    popular: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited contracts",
      "80 AI analyses/month",
      "15 AI comparisons/month",
      "5 workspaces · 3 seats",
    ],
    cta: "Start Free Trial",
    href: "/login",
    popular: false,
  },
  {
    name: "Business",
    price: "$69",
    period: "/month",
    features: [
      "Unlimited contracts",
      "300 AI analyses/month",
      "50 AI comparisons/month",
      "Unlimited workspaces · 10 seats",
    ],
    cta: "Start Business",
    href: "/login",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1714] mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-[#7a7168]">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl flex flex-col ${
                plan.popular
                  ? "bg-[#1a1714] text-[#f5f0e8] border-2 border-[#c8873a] shadow-xl"
                  : "bg-white border border-[#e0d9ce] shadow-sm"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#c8873a] text-white text-xs font-semibold rounded-full whitespace-nowrap">
                  Most Popular
                </span>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-serif">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-[#9a8f82]" : "text-[#7a7168]"}`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-[#c8873a] mt-0.5 flex-shrink-0" />
                    <span className={plan.popular ? "text-[#d4cec8]" : "text-[#3a3530]"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full text-center py-3 rounded-xl font-medium text-sm transition-all ${
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

        <p className="text-center text-xs text-[#9a8f82] mt-6">
          Prices in USD. Local currency accepted. No credit card required for free plan.
        </p>
      </div>
    </section>
  );
}
