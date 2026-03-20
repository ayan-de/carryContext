const stats = [
  { value: "94%", label: "Less Repetition" },
  { value: "2.4x", label: "Faster Iteration" },
  { value: "Local", label: "Data Privacy" },
  { value: "0ms", label: "Context Latency" },
];

export function ValueProp() {
  return (
    <section className="py-40 px-8 max-w-4xl mx-auto text-center">
      <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
        Stop Explaining. <span className="text-primary italic">Start Coding.</span>
      </h2>
      <p className="text-xl text-on-surface-variant leading-loose mb-16">
        Developers spend 40% of their day just trying to get the AI to understand the
        state of their system. ContextCarry gives your AI a photographic memory of your
        repository, so it starts every session with total clarity.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-3xl font-bold text-on-surface mb-1">{stat.value}</div>
            <div className="text-xs uppercase tracking-widest text-on-surface-variant">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
