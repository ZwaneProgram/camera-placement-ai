"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Badge } from "@/components/ui/badge";
import type { DecoratedProduct } from "@/lib/products";

export function ProductCard({ product }: { product: DecoratedProduct }) {
  const router = useRouter();
  const { add } = useCart();

  return (
    <div
      onClick={() => router.push(`/products/${product.id}`)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_6px_20px_rgba(14,27,42,.06)] transition-all duration-200 hover:-translate-y-1 hover:border-brand-teal hover:shadow-[0_18px_40px_rgba(14,27,42,.14)]"
    >
      <div className="sv-hatch relative flex aspect-square items-center justify-center">
        <span className="rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          {product.en}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-[15px] pt-3.5 pb-4">
        <div className="mb-1.5 font-mono text-[11px] font-semibold text-brand-blue">
          {product.brand}
        </div>
        <div className="mb-2 text-[15px] font-semibold leading-snug text-ink">
          {product.name}
        </div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="text-[19px] font-bold text-ink">
            {product.priceLabel}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              add(product);
            }}
            aria-label="เพิ่มลงตะกร้า"
            className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-brand-blue"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
