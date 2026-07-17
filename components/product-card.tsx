"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Image from "next/image";

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
        {product.discount > 0 && (
          <Badge className="absolute left-2.5 top-2.5 z-10 border-transparent bg-destructive text-white shadow-[0_2px_8px_rgba(14,27,42,.18)]">
            -{product.discount}%
          </Badge>
        )}
        {product.ai && (
          <Badge
            variant="teal"
            className="absolute right-2.5 top-2.5 z-10 shadow-[0_2px_8px_rgba(14,27,42,.18)]"
          >
            AI
          </Badge>
        )}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span className="rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            {product.en}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-[15px] pt-3.5 pb-4">
        {product.brand && (
          <div className="mb-1.5 font-mono text-[11px] font-semibold text-brand-blue">
            {product.brand}
          </div>
        )}
        <div className="mb-2 text-[15px] font-semibold leading-snug text-ink">
          {product.displayName}
        </div>
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
            <span className="text-[18px] font-bold text-ink">
              {product.priceLabel}
            </span>
            {product.discount > 0 && (
              <span className="text-[13px] font-medium text-muted-foreground line-through">
                {product.oldPriceLabel}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              add(product);
            }}
            aria-label="เพิ่มลงตะกร้า"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white transition-colors hover:bg-brand-blue"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
