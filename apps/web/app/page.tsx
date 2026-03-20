import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Integrations } from "@/components/sections/Integrations";
import { Features } from "@/components/sections/Features";
import { ValueProp } from "@/components/sections/ValueProp";
import { Testimonials } from "@/components/sections/Testimonials";
import SplashCursor from "@/components/SplashCursor";
import Folder from "@/components/Folder";

export default function Home() {
  return (
    <>
      {/* Grid Background */}
      {/* <div className="grid-background" /> */}

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 overflow-x-hidden relative">
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
    </>
  );
}
