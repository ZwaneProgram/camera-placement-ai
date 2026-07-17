import { cn } from "@/lib/utils";

/** Simple pulsing placeholder block used by route `loading.tsx` screens. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ink/[.07]", className)} />;
}
