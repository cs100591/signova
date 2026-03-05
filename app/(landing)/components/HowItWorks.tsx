const steps = [
  {
    step: "1",
    title: "Upload your contract",
    description: "PDF or paste text. Any contract type — employment, NDA, lease, SaaS, and more.",
  },
  {
    step: "2",
    title: "Tell us which party you are",
    description: "We analyze from YOUR perspective. Not generic — specific to your position and rights.",
  },
  {
    step: "3",
    title: "Get your risk analysis",
    description: "Risk score, key findings, and negotiation suggestions. In plain language, not legal jargon.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-[#f5f0e8]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#1a1714] mb-3">
            From contract to clarity in 3 steps
          </h2>
          <p className="text-[#7a7168]">Fast, simple, and built for non-lawyers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-[#ddd5c8]" />

          {steps.map((item) => (
            <div key={item.step} className="text-center relative">
              <div className="w-12 h-12 rounded-full bg-[#1a1714] text-[#f5f0e8] flex items-center justify-center text-lg font-serif mx-auto mb-6 relative z-10 shadow-md">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-[#1a1714] mb-3">{item.title}</h3>
              <p className="text-sm text-[#7a7168] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
