import { Loader2 } from "lucide-react";

/** Fallback loading screen for any route without a tailored skeleton. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-brand-blue" />
      <span className="text-sm font-medium">กำลังโหลด…</span>
    </div>
  );
}
