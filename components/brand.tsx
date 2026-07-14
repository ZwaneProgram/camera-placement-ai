import Link from "next/link";

import { cn } from "@/lib/utils";

/** SUCCESS IT gradient logo mark + wordmark. */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5", className)}
    >
      <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)] shadow-[0_4px_14px_rgba(47,107,255,.28)]">
        <span className="size-3 rounded-full border-[3px] border-white" />
      </span>
      <span className="text-xl font-bold tracking-tight text-ink">
        <span className="text-brand-blue">SUCCESS</span> IT
      </span>
    </Link>
  );
}
