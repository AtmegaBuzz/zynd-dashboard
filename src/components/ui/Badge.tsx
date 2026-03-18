import { cn } from "@/lib/utils";

type BadgeVariant = "active" | "inactive" | "deprecated" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  active: "bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/30",
  inactive: "bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30",
  deprecated: "bg-red-500/15 text-red-400 border-red-500/30",
  default: "bg-white/5 text-[#E0E7FF]/60 border-white/10",
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps): React.ReactNode {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase leading-tight tracking-wider",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
