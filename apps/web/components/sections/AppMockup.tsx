import { Icon } from "@/components/ui";

export function AppMockup() {
  return (
    <div className="relative bg-surface-container-lowest rounded-xl shadow-2xl overflow-hidden ghost-border aspect-video">
      <div className="flex h-full">
        {/* Left Panel (Sources) */}
        <div className="w-1/4 bg-surface-container-low p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-3/4 bg-surface-container-highest rounded" />
            <div className="h-4 w-1/2 bg-surface-container-highest rounded" />
            <div className="h-4 w-2/3 bg-surface-container-highest rounded" />
          </div>
        </div>

        {/* Center Panel (Main Editor) */}
        <div className="flex-1 bg-surface p-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-lg">
            {/* Command Palette Overlay */}
            <div className="bg-surface-bright/80 backdrop-blur-xl p-4 rounded-xl shadow-2xl border border-primary/20">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-3 mb-3">
                <Icon name="search" className="text-primary" />
                <span className="text-on-surface/80">Search Context...</span>
              </div>
              <div className="space-y-2">
                <div className="bg-primary/10 p-2 rounded flex justify-between items-center">
                  <span className="text-sm text-primary">auth_middleware.go</span>
                  <span className="text-[10px] text-primary/60 font-mono">
                    RETRIEVED 2m ago
                  </span>
                </div>
                <div className="p-2 rounded flex justify-between items-center hover:bg-surface-container-high transition-colors">
                  <span className="text-sm text-on-surface-variant">
                    payment_intent_logic.ts
                  </span>
                  <span className="text-[10px] text-on-surface-variant/40 font-mono">
                    VS CODE
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 opacity-20">
            <div className="h-2 w-full bg-on-surface-variant rounded" />
            <div className="h-2 w-5/6 bg-on-surface-variant rounded" />
            <div className="h-2 w-4/6 bg-on-surface-variant rounded" />
            <div className="h-2 w-full bg-on-surface-variant rounded" />
          </div>
        </div>

        {/* Right Panel (AI Assistant) */}
        <div className="w-1/4 bg-surface-container-low p-4">
          <div className="h-full border-l border-outline-variant/10 pl-4 space-y-4">
            <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center">
              <Icon name="sparkles" size="sm" className="text-primary" />
            </div>
            <div className="h-20 w-full bg-surface-container-highest rounded-lg p-2">
              <div className="h-2 w-full bg-primary/20 rounded mb-2" />
              <div className="h-2 w-3/4 bg-primary/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
