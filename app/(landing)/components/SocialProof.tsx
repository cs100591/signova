export default function SocialProof() {
  const stats = [
    { value: "2,400+", label: "Contracts analyzed" },
    { value: "1,800+", label: "Users worldwide" },
    { value: "40+", label: "Countries" },
  ];

  return (
    <section className="py-14 bg-white border-y border-[#e0d9ce]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <p className="text-sm text-[#9a8f82] uppercase tracking-widest font-medium mb-8">
          Trusted by freelancers, founders, and professionals worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-12 lg:gap-20">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl lg:text-4xl font-serif text-[#1a1714] mb-1">{value}</div>
              <div className="text-sm text-[#9a8f82]">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
