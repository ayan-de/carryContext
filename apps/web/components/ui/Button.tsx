import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2",
          "active:scale-95",
          {
            "kinetic-gradient text-on-primary shadow-lg hover:shadow-primary/20":
              variant === "primary",
            "bg-surface-container-high text-on-surface ghost-border hover:bg-surface-container-highest":
              variant === "secondary",
            "text-primary bg-transparent hover:bg-surface-container-high":
              variant === "ghost",
          },
          {
            "px-4 py-2 text-sm rounded-lg": size === "sm",
            "px-6 py-3 text-sm rounded-lg": size === "md",
            "px-8 py-4 text-base rounded-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
