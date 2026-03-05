const findings = [
  {
    severity: "HIGH",
    title: "Unlimited liability clause",
    issue: "You are liable for any and all damages with no cap.",
    suggestion: "Add: Liability shall not exceed the total fees paid in the 12 months preceding the claim.",
    color: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  },
  {
    severity: "MEDIUM",
    title: "Auto-renewal without notice",
    issue: "Contract renews automatically — 60-day notice required to cancel.",
    suggestion: "Add: Vendor must provide 30-day written notice prior to auto-renewal.",
    color: { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  },
  {
    severity: "LOW",
    title: "Broad IP assignment",
    issue: "All work product is assigned to company, including pre-existing IP.",
    suggestion: "Limit assignment to work created specifically for this engagement.",
    color: { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db" },
  },
];

export default function RiskDemo() {
  return (
    <section className="py-24 lg:py-32 bg-[#1a1714]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-serif text-[#f5f0e8] mb-3">See it in action</h2>
          <p className="text-[#7a7168]">This is what Signova shows you after analysis</p>
        </div>

        {/* Mock app panel */}
        <div className="bg-[#f8f7f4] rounded-2xl overflow-hidden shadow-2xl border border-[#2e2a26]">
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-[#e0d9ce]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-xs text-[#9a8f82] ml-2 font-mono">Vendor Agreement — Analysis</span>
          </div>

          <div className="p-6 lg:p-8">
            {/* Risk score */}
            <div className="flex items-center gap-5 mb-8 p-5 bg-white rounded-xl border border-[#e0d9ce] shadow-sm">
              <div className="w-16 h-16 rounded-full border-4 border-[#dc2626] flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-[#1a1714]">72</span>
              </div>
              <div>
                <div className="text-xs text-[#9a8f82] uppercase tracking-widest mb-1">Risk Score</div>
                <div className="text-lg font-semibold text-[#dc2626]">High Risk</div>
                <div className="text-sm text-[#7a7168] mt-0.5">3 issues require attention</div>
              </div>
            </div>

            {/* Finding cards */}
            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-xl border border-[#e0d9ce] overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold uppercase flex-shrink-0"
                      style={{ backgroundColor: f.color.bg, color: f.color.text, border: `1px solid ${f.color.border}` }}
                    >
                      {f.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#1a1714] mb-1">{f.title}</div>
                      <div className="text-xs text-[#7a7168]">{f.issue}</div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="bg-[#f5f0e8] rounded-lg p-3 text-xs text-[#3a3530]">
                      <span className="text-[#9a8f82] uppercase tracking-wide font-semibold mr-2">Suggestion:</span>
                      {f.suggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
