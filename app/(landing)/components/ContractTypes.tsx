const types = [
  "Employment", "NDA", "Freelance", "Lease / Rental",
  "SaaS", "Vendor", "Service Agreement", "Partnership",
  "Consulting", "Non-compete", "Distribution", "MSA",
  "Independent Contractor", "Investment", "And more...",
];

export default function ContractTypes() {
  return (
    <section className="py-20 bg-[#f5f0e8]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-2xl lg:text-3xl font-serif text-[#1a1714] mb-3">
          Works with any contract type
        </h2>
        <p className="text-[#7a7168] mb-10 text-sm">If it&apos;s a contract, Signova can analyze it</p>
        <div className="flex flex-wrap justify-center gap-3">
          {types.map((type) => (
            <span
              key={type}
              className="px-4 py-2 bg-white border border-[#e0d9ce] rounded-full text-sm text-[#1a1714] hover:border-[#c8873a] hover:text-[#c8873a] transition-colors cursor-default"
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
