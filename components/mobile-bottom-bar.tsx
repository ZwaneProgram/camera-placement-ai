"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";

export function MobileBottomBar() {
  const router = useRouter();
  const { count, toggle } = useCart();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2.5 border-t border-line bg-white p-2.5 px-4 shadow-[0_-6px_20px_rgba(14,27,42,.08)] md:hidden">
      <button
        onClick={() => router.push("/products")}
        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[13px] border-[1.5px] border-line bg-white text-xs font-semibold text-ink"
      >
        สินค้า
      </button>
      <button
        onClick={toggle}
        className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[13px] bg-ink text-[15px] font-bold text-white"
      >
        <ShoppingCart className="size-4" />
        ตะกร้า
        {count > 0 && (
          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brand-teal px-1.5 text-xs font-bold text-ink">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}
