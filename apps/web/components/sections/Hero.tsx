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
    <section className="relative px-8 pt-0 pb-32 -mt-16 max-w-7xl mx-auto flex flex-col items-start">
      <div className="relative z-10 flex flex-col items-start">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low ghost-border mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
            v1.0.4 Terminal Velocity
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 text-white max-w-md">
          The Kinetic Terminal<br />for AI Context.
        </h1>

        {/* Subheadline */}
        <p className="text-sm md:text-base text-white/80 max-w-xl mb-8 leading-relaxed">
          ContextCarry automatically saves and retrieves context from your coding
          sessions, so you never have to repeat yourself to an AI again.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button variant="primary">
            Get Started Free
          </Button>
          <Button variant="secondary">
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
      </div>

      {/* App Mockup */}
      <div className="w-full max-w-4xl relative group mt-9 ml-auto mr-8">
        <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <AppMockup />
      </div>
    </section>
  );
}
