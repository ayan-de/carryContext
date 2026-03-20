import RotatingText from "../RotatingText";
import LogoLoop from "../LogoLoop";

const integrations = [
  { src: "/claudecode-1.svg", alt: "Claude Code" },
  { src: "/kilocode.svg", alt: "KiloCode" },
  { src: "/crush.svg", alt: "Crush" },
  { src: "/roocode.svg", alt: "RooCode" },
  { src: "/opencode.svg", alt: "OpenCode" },
  { src: "/cline.svg", alt: "Cline" },
  { src: "/cursor.svg", alt: "Cursor" },
  { src: "/goose.svg", alt: "Goose" },
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
        <div className="h-24">
          <LogoLoop
            logos={integrations}
            speed={80}
            direction="left"
            logoHeight={64}
            gap={48}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            ariaLabel="AI tool integrations"
          />
        </div>
      </div>
    </section>
  );
}
