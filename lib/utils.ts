import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Thai Baht price formatter, e.g. 1290 -> "฿1,290" */
export function formatBaht(n: number) {
  return "฿" + n.toLocaleString("en-US");
}
