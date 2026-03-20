import Image from "next/image";
import RotatingText from "../RotatingText";

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
        <h2 className="text-2xl md:text-3xl font-semibold text-on-surface mb-2 flex items-center justify-center gap-2 flex-wrap">
          <span>Compatible with</span>
          <RotatingText
            texts={['Claude Code', 'Cursor', 'Cline', 'KiloCode', 'RooCode', 'Goose', 'Crush', 'OpenCode']}
            mainClassName="px-2 sm:px-2 md:px-3 bg-cyan-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
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
                style={{ width: 'auto', height: 'auto' }}
              />
              {/* <span className="text-sm font-semibold text-on-surface-variant/70 group-hover:text-on-surface transition-colors">
                {item.label}
              </span> */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
