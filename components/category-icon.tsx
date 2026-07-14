import { Cctv, RadioTower, Siren, Fingerprint, HardDrive } from "lucide-react";

import type { CategoryDef } from "@/lib/products";
import { cn } from "@/lib/utils";

const ICONS = {
  dome: Cctv,
  sensor: RadioTower,
  alarm: Siren,
  lock: Fingerprint,
  nvr: HardDrive,
} as const;

export function CategoryIcon({
  icon,
  gradient,
  className,
  size = 44,
}: {
  icon: CategoryDef["icon"];
  gradient: string;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[icon];
  return (
    <span
      className={cn("flex items-center justify-center rounded-xl", className)}
      style={{ background: gradient, width: size, height: size }}
    >
      <Icon className="size-1/2 text-white" strokeWidth={2.4} />
    </span>
  );
}
