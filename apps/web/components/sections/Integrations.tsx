import { Icon, type IconName } from "@/components/ui";

const integrations: { icon: IconName; label: string }[] = [
  { icon: "cpu", label: "Claude Code" },
  { icon: "blocks", label: "KiloCode" },
  { icon: "zap", label: "Antigravity" },
  { icon: "code", label: "GitHub Copilot" },
  { icon: "plug", label: "OpenCode" },
  { icon: "blocks", label: "Cline" },
  { icon: "target", label: "Cursor" },
];

export function Integrations() {
  return (
    <section className="py-24 px-8 border-y border-outline-variant/10 bg-surface-container-lowest/30">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-on-surface">
          Compatible with your favorite agents
        </h2>
        <p className="text-on-surface-variant text-sm md:text-base mb-12">
          Seamlessly inject context into any AI workflow.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center justify-items-center opacity-60">
          {integrations.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-3 group hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center ghost-border group-hover:border-primary/50 transition-colors">
                <Icon name={item.icon} className="text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
