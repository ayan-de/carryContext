import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Integrations } from "@/components/sections/Integrations";
import { Features } from "@/components/sections/Features";
import { ValueProp } from "@/components/sections/ValueProp";
import { Testimonials } from "@/components/sections/Testimonials";

export default function Home() {
  return (
    <>
      {/* Grid Background */}
      <div className="grid-background" />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 overflow-x-hidden relative">
        <Hero />
        <Integrations />
        <Features />
        <ValueProp />
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
