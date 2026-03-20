import Image from "next/image";

const integrations = [
  { src: "/claudecode-1.svg", label: "Claude Code", size: 150 },
  { src: "/kilocode.svg", label: "KiloCode", size: 150 },
  { src: "/crush.svg", label: "Crush", size: 150 },
  { src: "/roocode.svg", label: "RooCode", size: 150 },
  { src: "/opencode.svg", label: "OpenCode", size: 150 },
  { src: "/cline.svg", label: "Cline", size: 150 },
  { src: "/cursor.svg", label: "Cursor", size: 150 },
  { src: "/goose.svg", label: "Goose", size: 150 },
];

export function Integrations() {
  return (
    <section className="py-24 px-8 border-y border-outline-variant/10 bg-surface-container-lowest/30">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-on-surface">
          Compatible with your favorite agents
        </h2>
        <p className="text-on-surface-variant text-sm md:text-base mb-16">
          Seamlessly inject context into any AI workflow.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {integrations.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-4 p-6 rounded-xl bg-surface-container-high ghost-border group cursor-pointer hover:border-primary/50 hover:bg-surface-container-highest transition-all duration-300"
            >
              <Image
                src={item.src}
                alt={item.label}
                width={item.size}
                height={item.size}
                className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <span className="text-sm font-semibold text-on-surface-variant/70 group-hover:text-on-surface transition-colors">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
