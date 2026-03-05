const features = [
  {
    emoji: "📄",
    title: "Store & Organize",
    description: "Keep all your contracts in one secure place. Never lose an agreement again.",
  },
  {
    emoji: "🔍",
    title: "AI Risk Analysis",
    description: "Instant risk score from 0–100. Know what's dangerous before you sign.",
  },
  {
    emoji: "🎯",
    title: "Your Perspective",
    description: "Tell us which party you are. Get analysis specific to your position.",
  },
  {
    emoji: "💬",
    title: "Ask AI Anything",
    description: "Chat with AI about any clause. Get plain language explanations instantly.",
  },
  {
    emoji: "⏰",
    title: "Expiry Tracking",
    description: "Get notified before contracts expire. Never miss a renewal deadline.",
  },
  {
    emoji: "📋",
    title: "Negotiation Suggestions",
    description: "Know exactly what to push back on. Specific rewrite suggestions included.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1714] mb-3">
            Everything you need to understand any contract
          </h2>
          <p className="text-[#7a7168]">Built for people who sign contracts, not lawyers who draft them</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-[#e0d9ce] hover:border-[#c8873a]/40 hover:shadow-md transition-all bg-[#fdfaf7]"
            >
              <div className="text-2xl mb-4">{f.emoji}</div>
              <h3 className="text-base font-semibold text-[#1a1714] mb-2">{f.title}</h3>
              <p className="text-sm text-[#7a7168] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
