"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Check, Sparkles } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiSimulator } from "@/components/detail/ai-simulator";
import {
  productDesc,
  productHighlights,
  productSpecs,
  type DecoratedProduct,
} from "@/lib/products";
import { CONTACT } from "@/lib/contact";
import { cn } from "@/lib/utils";

export function ProductDetail({ product }: { product: DecoratedProduct }) {
  const { add } = useCart();
  const [qty, setQty] = React.useState(1);
  const aiRef = React.useRef<HTMLDivElement>(null);

  const gallery = product.images.length
    ? product.images
    : product.imageUrl
      ? [product.imageUrl]
      : [];
  const [active, setActive] = React.useState<string | null>(gallery[0] ?? null);

  const highlights = productHighlights(product);
  const specs = productSpecs(product);

  return (
    <main className="mx-auto max-w-[1240px] animate-sv-fade px-5 pt-7 pb-15">
      <div className="mb-[18px] font-mono text-[13px] text-muted-foreground">
        <Link href="/" className="hover:text-brand-blue">
          หน้าแรก
        </Link>{" "}
        / {product.typeLabel} / {product.name}
      </div>

      <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="sv-hatch relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[20px] border border-line shadow-[0_12px_30px_rgba(14,27,42,.08)]">
            {active ? (
              <Image
                src={active}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <span className="rounded-lg bg-white px-3 py-1.5 font-mono text-[13px] text-muted-foreground">
                {product.en} — product shot
              </span>
            )}
            {product.ai && (
              <Badge
                variant="teal"
                className="absolute top-3.5 left-3.5 bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)] text-ink"
              >
                AI ลองวางกล้อง
              </Badge>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex flex-wrap gap-2.5">
              {gallery.map((url, i) => (
                <button
                  key={url + i}
                  onClick={() => setActive(url)}
                  className={cn(
                    "relative size-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:size-24",
                    active === url
                      ? "border-brand-teal ring-2 ring-brand-teal/25"
                      : "border-line hover:border-brand-teal/50"
                  )}
                  aria-label={`ภาพที่ ${i + 1}`}
                >
                  <Image
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-3">
            <Badge variant="accent">{product.brand}</Badge>
          </div>
          <h1 className="mb-2 text-[clamp(24px,3.2vw,34px)] leading-tight font-bold tracking-tight">
            {product.name}
          </h1>
          <div className="mb-[18px] font-mono text-[13px] text-muted-foreground">
            {product.en}
          </div>
          <div className="mb-[22px] flex items-baseline gap-3">
            <div className="text-4xl font-bold text-ink">
              {product.priceLabel}
            </div>
            <div className="text-lg text-muted-foreground line-through">
              {product.oldPriceLabel}
            </div>
            <Badge variant="teal">-{product.discount}%</Badge>
          </div>

          <div className="mb-6 flex flex-col gap-2">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-2.5 text-[15px]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-teal text-ink">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {h}
              </div>
            ))}
          </div>

          <div className="mb-3.5 flex flex-wrap gap-3">
            <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-line">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-13 w-11 items-center justify-center bg-secondary text-xl text-ink"
                aria-label="ลด"
              >
                <Minus className="size-4" />
              </button>
              <div className="w-12 text-center text-base font-bold">{qty}</div>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-13 w-11 items-center justify-center bg-secondary text-xl text-ink"
                aria-label="เพิ่ม"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              onClick={() => add(product, qty)}
              className="h-13 min-w-[200px] flex-1 rounded-[14px] text-base shadow-[0_10px_26px_rgba(14,27,42,.22)]"
            >
              เพิ่มลงตะกร้า
            </Button>
          </div>
          <Button
            variant="accent"
            onClick={() =>
              aiRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="h-13 w-full rounded-[14px] border-[1.5px] border-brand-blue text-base"
          >
            <Sparkles className="size-4" /> ลองวางกล้องในห้องคุณด้วย AI
          </Button>

          {/* Chat card */}
          <div className="mt-4 rounded-2xl border border-line bg-secondary px-[18px] py-4 shadow-[0_8px_24px_rgba(14,27,42,.06)]">
            <div className="mb-1 flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-teal" />
              <div className="text-[15px] font-bold">
                สนใจสั่งซื้อ? ทักแชทได้เลย
              </div>
            </div>
            <div className="mb-3.5 text-[13px] leading-relaxed text-muted-foreground">
              สอบถามสเปค ขอคำแนะนำการติดตั้ง หรือสั่งซื้อผ่านแชท ทีมงานตอบไว
            </div>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={CONTACT.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-success-line text-[15px] font-bold text-white"
              >
                <span className="flex size-[22px] items-center justify-center rounded-md bg-white/25 text-xs font-bold">
                  L
                </span>
                สั่งซื้อทาง LINE
              </a>
              <a
                href={CONTACT.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 min-w-[140px] flex-1 items-center justify-center gap-2 rounded-xl bg-facebook text-[15px] font-bold text-white"
              >
                <span className="flex size-[22px] items-center justify-center rounded-md bg-white/25 text-[13px] font-bold">
                  f
                </span>
                แชท Facebook
              </a>
            </div>
          </div>

          <div className="mt-[22px] flex flex-wrap gap-5">
            {["รับประกัน 2 ปี", "ติดตั้งฟรี กทม.", "ส่งฟรีทั่วไทย"].map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 text-[13px] text-muted-foreground"
              >
                <span className="size-2 rounded-full bg-brand-teal" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details + specs */}
      <section className="mt-11 rounded-[20px] border border-line bg-secondary p-6 shadow-[0_10px_30px_rgba(14,27,42,.06)] sm:p-10">
        <h3 className="mb-4 text-[22px] font-bold">รายละเอียดสินค้า</h3>
        <p className="mb-9 max-w-[760px] text-base leading-loose text-muted-foreground">
          {productDesc(product)}
        </p>

        <h3 className="mb-4 text-[22px] font-bold">สเปคสินค้า</h3>
        <div className="max-w-[640px] overflow-hidden rounded-[14px] border border-line bg-white">
          {specs.map((sp, i) => (
            <div
              key={sp.k}
              className={cn(
                "flex justify-between px-4 py-3",
                i % 2 === 0 && "bg-secondary"
              )}
            >
              <span className="text-[15px] text-muted-foreground">{sp.k}</span>
              <span className="text-[15px] font-semibold">{sp.v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI simulator */}
      <AiSimulator
        ref={aiRef}
        product={product}
        onAddToCart={() => add(product, qty)}
      />
    </main>
  );
}
