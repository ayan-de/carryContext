import Link from "next/link";

const footerLinks = [
  { href: "#", label: "Terms" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Github" },
  { href: "#", label: "Discord" },
];

export function Footer() {
  return (
    <footer className="bg-background/50 w-full py-12 px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center md:items-start gap-4">
          <span className="text-lg font-black text-on-surface">ContextCarry</span>
          <span className="text-xs uppercase tracking-widest text-outline-variant">
            © 2026 ContextCarry. Terminal Velocity.
          </span>
        </div>
        <div className="flex gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-widest text-outline-variant hover:text-on-surface transition-colors opacity-80 hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
