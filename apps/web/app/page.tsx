import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Integrations } from "@/components/sections/Integrations";
import { Features } from "@/components/sections/Features";
import { ValueProp } from "@/components/sections/ValueProp";
import { Testimonials } from "@/components/sections/Testimonials";
import SplashCursor from "@/components/SplashCursor";
import Folder from "@/components/Folder";
import LaserFlow from "@/components/LaserFlow";

export default function Home() {
  return (
    <div className="relative">
      {/* LaserFlow Background - positioned at root level to appear behind navbar */}
      <div className="absolute top-0 left-0 right-0 h-[1000px] -z-10 overflow-hidden pointer-events-none">
        <LaserFlow
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
          color="#CF9EFF"
          horizontalSizing={1}
          verticalSizing={5}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.45}
          fogScale={0.3}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
        />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 overflow-x-hidden">
        <Hero />
        <Integrations />
        <Features />
        <ValueProp />
        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Folder
            color="#ff4d16"
            size={1.5}
            label="~/.contextcarry"
            items={[
              <span key="1" className="text-[8px] font-bold text-gray-600 flex items-center justify-center w-full h-full">.contextcarry</span>,
              <span key="2" className="text-[8px] font-bold text-gray-600 flex items-center justify-center w-full h-full">sessions</span>,
              <span key="3" className="text-[8px] font-bold text-gray-600 flex items-center justify-center w-full h-full">config.json</span>
            ]}
          />
        </div>
        <Testimonials />
        <SplashCursor />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
