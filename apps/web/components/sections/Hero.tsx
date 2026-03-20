"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { AppMockup } from "./AppMockup";

export function Hero() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText("npm i -g contextcarry");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative px-8 pt-20 pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
      <div className="hero-glow" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low ghost-border mb-8">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
          v1.0.4 Terminal Velocity
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-b from-on-surface to-on-surface-variant bg-clip-text text-transparent max-w-4xl">
        The Kinetic Terminal for AI Context.
      </h1>

      {/* Subheadline */}
      <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
        ContextCarry automatically saves and retrieves context from your coding
        sessions, so you never have to repeat yourself to an AI again.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button variant="primary" size="lg">
          Get Started Free
        </Button>
        <Button variant="secondary" size="lg">
          <Icon name="play" className="text-primary" />
          Watch the Demo
        </Button>
      </div>

      {/* Install Command */}
      <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 flex items-center justify-between group hover:border-primary/50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Icon name="terminal" size="sm" className="text-primary" />
          <code className="font-mono text-sm text-primary tracking-tight">
            npm i -g contextcarry
          </code>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center p-1.5 rounded-md hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-primary"
          title="Copy to clipboard"
        >
          <Icon name={copied ? "check" : "copy"} size="sm" />
        </button>
      </div>

      {/* App Mockup */}
      <div className="w-full max-w-6xl relative group mt-20">
        <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <AppMockup />
      </div>
    </section>
  );
}
