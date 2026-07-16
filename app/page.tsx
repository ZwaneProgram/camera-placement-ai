import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icon";
import { BENEFITS, CATEGORIES } from "@/lib/products";
import { bestSellers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const best = await bestSellers(4);

  return (
    <div className="animate-sv-fade">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_130%_at_78%_-10%,#b8f0e6_0%,#cfeaf7_34%,#e4f0f7_60%,#dbe7f0_100%)]">
        <div className="sv-dots absolute inset-0 opacity-85" />
        <div className="absolute top-1/2 left-1/2 h-[44%] max-h-[340px] w-[80%] max-w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(94,231,211,.28),rgba(47,107,255,.12)_52%,transparent_74%)] blur-[26px]" />

        <div className="relative mx-auto max-w-[1240px] px-5 pt-6 pb-11">
          <div className="mb-3.5 h-px bg-line" />

          {/* Stage */}
          <div className="relative flex flex-col items-center gap-6 lg:block lg:min-h-[640px]">
            {/* Big title */}
            <h1 className="text-center text-[clamp(52px,15vw,200px)] leading-[.92] font-bold tracking-[-.05em] text-ink lg:absolute lg:top-3 lg:right-0 lg:left-0 lg:z-[1]">
              <span className="text-brand-blue">SUCCESS</span> IT
            </h1>

            {/* Big word behind the camera */}
            <div className="pointer-events-none absolute top-[42%] left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none lg:top-[58%]">
              <span className="text-[clamp(64px,18vw,240px)] leading-none font-black tracking-[-.04em] text-ink/[.14]">
                CENTER
              </span>
            </div>

            {/* Camera visual */}
            <div className="relative z-[2] lg:absolute lg:top-[150px] lg:left-1/2 lg:-translate-x-1/2 lg:-rotate-4">
              <Image
                src="/high-end-security-camera.png"
                alt="SUCCESS IT Bullet Camera"
                width={1500}
                height={1125}
                priority
                className="h-auto w-[min(600px,90vw)] drop-shadow-[0_30px_40px_rgba(14,27,42,.28)]"
              />
            </div>

            {/* Copy (left) */}
            <div className="max-w-[248px] text-center lg:absolute lg:top-[52%] lg:left-0 lg:z-[3] lg:text-left">
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do
                eiusmod tempor incididunt ut labore.
              </p>
            </div>

            {/* Floating product card (right) */}
            <div className="w-[212px] rounded-2xl border border-white/70 bg-white/85 p-[15px] shadow-[0_22px_46px_rgba(14,27,42,.18)] backdrop-blur-md lg:absolute lg:top-[30%] lg:right-0 lg:z-[3] lg:rotate-4">
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="teal">ขายดี</Badge>
                <span className="tracking-widest text-muted-foreground">⋯</span>
              </div>
              <div className="mb-0.5 font-mono text-[11px] text-brand-blue">
                SUCCESS IT
              </div>
              <div className="mb-2 text-[15px] leading-snug font-bold text-ink">
                กล้อง Bullet กันน้ำ 5MP
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold text-ink">฿1,890</div>
                <Link
                  href="/products/2"
                  className="flex size-[34px] items-center justify-center rounded-[10px] bg-ink text-white"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3 lg:absolute lg:bottom-2 lg:left-1/2 lg:z-[4] lg:-translate-x-1/2">
              <Button asChild variant="gradient" size="pill">
                <Link href="/products/1#ai-simulator">ทดลอง AI วางกล้อง</Link>
              </Button>
              <Button asChild variant="outline" size="pill">
                <Link href="/products">เลือกซื้อสินค้า</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="mx-auto max-w-[1240px] px-5 pt-14 pb-5">
        <div className="mb-6">
          <div className="mb-1.5 text-[13px] font-semibold tracking-wide text-brand-blue">
            CATEGORIES
          </div>
          <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight">
            หมวดหมู่สินค้า
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/products?cat=${cat.key}`}
              className="rounded-2xl border border-line bg-secondary p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-teal hover:shadow-[0_14px_30px_rgba(14,27,42,.09)]"
            >
              <CategoryIcon
                icon={cat.icon}
                gradient={cat.gradient}
                className="mb-3.5"
              />
              <div className="text-base font-bold">{cat.th}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {cat.en}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <section className="mx-auto max-w-[1240px] px-5 pt-11 pb-5">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[13px] font-semibold tracking-wide text-brand-blue">
              SUGGESTION
            </div>
            <h2 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight">
              สินค้าแนะนำ
            </h2>
          </div>
          <Button asChild variant="soft">
            <Link href="/products">
              ดูทั้งหมด <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {best.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section className="mx-auto max-w-[1240px] px-5 py-12">
        <div className="grid grid-cols-1 gap-5 rounded-[22px] border border-line bg-secondary p-7 shadow-[0_10px_30px_rgba(14,27,42,.06)] sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3.5">
              <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)]">
                <ShieldCheck className="size-5 text-white" />
              </span>
              <div>
                <div className="mb-1 text-[15px] font-bold">{b.title}</div>
                <div className="text-[13px] leading-relaxed text-muted-foreground">
                  {b.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="mx-auto max-w-[1240px] px-5 pb-16">
        <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#2F6BFF,#5EE7D3)] px-8 py-11">
          <div className="sv-dots-light absolute inset-0 opacity-50" />
          <div className="relative max-w-[560px] text-white">
            <h2 className="mb-2.5 text-[clamp(24px,3.4vw,34px)] font-bold tracking-tight">
              Lorem ipsum dolor sit amet
            </h2>
            <p className="text-base leading-relaxed opacity-95">
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua,
              ut enim ad minim veniam quis nostrud exercitation ullamco laboris.
            </p>
          </div>
          <Button
            asChild
            className="relative h-[52px] rounded-2xl bg-white px-7 text-base text-ink shadow-[0_12px_30px_rgba(14,27,42,.22)] hover:bg-white"
          >
            <Link href="/products">เลือกซื้อเลย</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
