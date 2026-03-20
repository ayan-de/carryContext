import {
  Navbar,
  Footer,
  Hero,
  Integrations,
  Features,
  ValueProp,
  Testimonials,
} from "@/components";

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
