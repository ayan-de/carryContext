import { Icon, type IconName } from "@/components/ui";

type BaseFeature = {
  id: string;
  span: string;
  title: string;
  description: string;
  bgClass: string;
};

type IconFeature = BaseFeature & {
  icon: IconName;
  showIcons?: never;
  icons?: never;
  decorativeIcon?: IconName;
  featured?: false;
};

type IconsFeature = BaseFeature & {
  icon?: never;
  showIcons: true;
  icons: IconName[];
  decorativeIcon?: never;
  featured?: false;
};

type FeaturedFeature = BaseFeature & {
  icon: IconName;
  featured: true;
  showIcons?: never;
  icons?: never;
  decorativeIcon?: never;
};

type Feature = IconFeature | IconsFeature | FeaturedFeature;

const features: Feature[] = [
  {
    id: "local-first",
    span: "md:col-span-8",
    icon: "shield",
    title: "Local-First Memory",
    description:
      "Your code remains yours. We index everything locally on your machine with zero cloud uploads. Privacy isn't a feature; it's the foundation.",
    decorativeIcon: "memory",
    bgClass: "bg-surface-container-high",
  },
  {
    id: "instant-retrieval",
    span: "md:col-span-4",
    icon: "keyboard",
    title: "Instant Retrieval",
    description:
      "Cmd+K to find any past decision across all your projects. AI context injected in milliseconds.",
    bgClass: "bg-surface-container-high hover:bg-surface-container-highest",
  },
  {
    id: "seamless-integration",
    span: "md:col-span-5",
    title: "Seamless Integration",
    description:
      "Native plugins for VS Code, Cursor, and a direct hook for ChatGPT/Claude web interfaces.",
    bgClass: "bg-surface-container-highest",
    showIcons: true,
    icons: ["code", "terminal", "brain"],
  },
  {
    id: "zero-fatigue",
    span: "md:col-span-7",
    icon: "zap",
    title: "Zero Fatigue Architecture",
    description:
      "Stop writing context paragraphs. ContextCarry builds a semantic graph of your intent as you type, making prompt engineering obsolete.",
    bgClass: "bg-primary-container/20 border-primary/20",
    featured: true,
  },
];

export function Features() {
  return (
    <section className="bg-surface-container-low/50 py-32 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`${feature.span} ${feature.bgClass} p-10 rounded-2xl ghost-border group overflow-hidden relative`}
            >
              {"decorativeIcon" in feature && feature.decorativeIcon && (
                <div className="absolute bottom-0 right-0 p-8 translate-y-8 group-hover:translate-y-0 transition-transform duration-500 opacity-20 group-hover:opacity-100">
                  <Icon
                    name={feature.decorativeIcon}
                    size="xl"
                    className="text-primary !w-24 !h-24"
                  />
                </div>
              )}

              {"showIcons" in feature && feature.showIcons && feature.icons && (
                <div className="flex gap-4 mb-8">
                  {feature.icons.map((icon) => (
                    <div
                      key={icon}
                      className="w-12 h-12 rounded bg-surface-container-low flex items-center justify-center ghost-border"
                    >
                      <Icon name={icon} className="text-on-surface-variant" />
                    </div>
                  ))}
                </div>
              )}

              {!("showIcons" in feature && feature.showIcons) && !("featured" in feature && feature.featured) && (
                <Icon name={feature.icon!} className="text-primary mb-6" size="lg" />
              )}

              {"featured" in feature && feature.featured ? (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="w-full md:w-48 aspect-square rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon
                      name={feature.icon}
                      className="text-primary animate-pulse !w-12 !h-12"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-on-surface-variant max-w-md text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
