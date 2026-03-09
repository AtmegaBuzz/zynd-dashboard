import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): React.ReactNode {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-white/[0.08]",
        className
      )}
    />
  );
}
