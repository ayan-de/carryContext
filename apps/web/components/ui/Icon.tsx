import {
  Terminal,
  Copy,
  Check,
  Play,
  MemoryStick,
  Shield,
  Keyboard,
  Code,
  Brain,
  Sparkles,
  User,
  Search,
  Cpu,
  Blocks,
  Plug,
  Target,
  Zap,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type IconName =
  | "terminal"
  | "copy"
  | "check"
  | "play"
  | "memory"
  | "shield"
  | "keyboard"
  | "code"
  | "brain"
  | "sparkles"
  | "user"
  | "search"
  | "cpu"
  | "blocks"
  | "plug"
  | "target"
  | "zap"
  | "lock";

const iconMap: Record<IconName, LucideIcon> = {
  terminal: Terminal,
  copy: Copy,
  check: Check,
  play: Play,
  memory: MemoryStick,
  shield: Shield,
  keyboard: Keyboard,
  code: Code,
  brain: Brain,
  sparkles: Sparkles,
  user: User,
  search: Search,
  cpu: Cpu,
  blocks: Blocks,
  plug: Plug,
  target: Target,
  zap: Zap,
  lock: Lock,
};

export interface IconProps {
  name: IconName;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Icon({ name, className, size = "md" }: IconProps) {
  const IconComponent = iconMap[name];

  return (
    <IconComponent
      className={cn(
        {
          "w-4 h-4": size === "sm",
          "w-5 h-5": size === "md",
          "w-6 h-6": size === "lg",
          "w-8 h-8": size === "xl",
        },
        className
      )}
    />
  );
}
