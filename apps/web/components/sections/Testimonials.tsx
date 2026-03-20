import { Icon } from "@/components/ui";

const testimonials = [
  {
    quote:
      "The 'No-Line' UI philosophy really shines here. It feels like a natural extension of my OS rather than just another heavy dev tool.",
    author: "Alex Rivera",
    role: "Staff Engineer @ Stripe",
  },
  {
    quote:
      "I used to spend 10 minutes every morning pasting code into ChatGPT. Now I just Cmd+K and start asking. It's magic.",
    author: "Sarah Chen",
    role: "Founder @ Synthetix",
  },
  {
    quote:
      "ContextCarry's local-first approach meant I could finally use AI on our proprietary HIPAA-compliant stack. Game changer.",
    author: "Marcus Thorne",
    role: "Security Lead @ HealthCore",
  },
];

export function Testimonials() {
  return (
    <section className="pb-32 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((item) => (
          <div
            key={item.author}
            className="p-8 bg-surface-container rounded-xl ghost-border"
          >
            <p className="text-on-surface leading-relaxed mb-6 italic">
              "{item.quote}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                <Icon name="user" size="sm" className="text-on-surface-variant" />
              </div>
              <div>
                <div className="text-sm font-bold">{item.author}</div>
                <div className="text-[10px] uppercase text-on-surface-variant">
                  {item.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
