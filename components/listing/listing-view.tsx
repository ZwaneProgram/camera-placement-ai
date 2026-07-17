"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_META,
  FILTERS,
  sortProducts,
  type DecoratedProduct,
  type FilterKey,
  type SortKey,
} from "@/lib/products";
import { cn } from "@/lib/utils";

const PER_PAGE = 8;

const PRICE_MIN = 0;
const PRICE_MAX = 6000;
const PRICE_STEP = 100;

export function ListingView({
  initialFilter,
  products: initialProducts,
  counts,
}: {
  initialFilter: FilterKey;
  products: DecoratedProduct[];
  counts: Record<string, number>;
}) {
  const [filter, setFilter] = React.useState<FilterKey>(initialFilter);
  const [sort, setSort] = React.useState<SortKey>("popular");
  const [price, setPrice] = React.useState<[number, number]>([
    PRICE_MIN,
    PRICE_MAX,
  ]);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => setFilter(initialFilter), [initialFilter]);
  // Any change to the result set sends the user back to the first page.
  React.useEffect(() => setPage(1), [filter, sort, price]);

  const meta = CATEGORY_META[filter] ?? CATEGORY_META.all;

  const products = React.useMemo(() => {
    const base = initialProducts.filter(
      (p) =>
        (filter === "all" || p.type === filter) &&
        p.price >= price[0] &&
        p.price <= price[1]
    );
    return sortProducts(base, sort);
  }, [filter, sort, price, initialProducts]);

  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = products.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  return (
    <div className="animate-sv-fade">
      {/* Dark hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#0E1B2A_0%,#123b5e_58%,#1a5fa8_120%)]">
        <div className="sv-dots-teal absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-7 px-5 pt-9 pb-8">
          <div className="min-w-[280px] flex-1">
            <div className="mb-3 font-mono text-[13px] text-white/55">
              หน้าแรก / สินค้าทั้งหมด
            </div>
            <h1 className="mb-2 text-[clamp(28px,3.6vw,42px)] font-bold tracking-tight text-white">
              {meta.title}
            </h1>
            <p className="max-w-[560px] text-[15px] leading-relaxed text-white/70">
              {meta.sub}
            </p>
          </div>

          <Link
            href="/products/1"
            className="max-w-[300px] shrink-0 rounded-[18px] border border-brand-teal/35 bg-white/[.06] p-5 backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-teal/40 bg-brand-teal/15 px-2.5 py-[5px] text-[11px] font-bold text-brand-teal">
              <Sparkles className="size-3" /> AI FEATURE
            </span>
            <div className="mb-1.5 text-lg leading-snug font-bold text-white">
              ลองวางกล้องในห้องคุณก่อนซื้อ
            </div>
            <div className="mb-4 text-xs leading-relaxed text-white/65">
              อัปโหลดรูปห้อง ให้ AI จำลองจุดติดตั้งที่ดีที่สุด
            </div>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,#5EE7D3,#2F6BFF)] px-[18px] text-[13px] font-bold text-ink">
              ทดลองเลย <ArrowRight className="size-3.5" />
            </span>
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pt-7 pb-15">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[246px_minmax(0,1fr)]">
          {/* Filter sidebar */}
          <aside className="rounded-[18px] border border-line bg-secondary p-5 shadow-[0_8px_26px_rgba(14,27,42,.06)] lg:sticky lg:top-[86px]">
            <div className="mb-4 text-base font-bold">ตัวกรอง</div>

            <div className="mb-2.5 text-[13px] font-semibold text-muted-foreground">
              ประเภทสินค้า
            </div>
            <div className="mb-5 flex flex-col gap-0.5">
              {FILTERS.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setFilter(t.k)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                    filter === t.k
                      ? "bg-ink text-white"
                      : "text-ink hover:bg-white"
                  )}
                >
                  <span>{t.l}</span>
                  <span
                    className={cn(
                      "text-xs",
                      filter === t.k ? "text-white/70" : "text-muted-foreground"
                    )}
                  >
                    {counts[t.k] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-2.5 text-[13px] font-semibold text-muted-foreground">
              ช่วงราคา
            </div>
            <div>
              <PriceRange value={price} onChange={setPrice} />
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                พบ <b className="text-ink">{products.length}</b> รายการ
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground">
                  เรียงตาม
                </span>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger className="min-w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">ยอดนิยม</SelectItem>
                    <SelectItem value="low">ราคาต่ำ → สูง</SelectItem>
                    <SelectItem value="high">ราคาสูง → ต่ำ</SelectItem>
                    <SelectItem value="rating">คะแนนรีวิว</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {pageProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-9 flex justify-center gap-2">
                <PageButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  label="หน้าก่อนหน้า"
                >
                  ‹
                </PageButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <PageButton
                    key={n}
                    active={n === currentPage}
                    onClick={() => setPage(n)}
                    label={`หน้า ${n}`}
                  >
                    {n}
                  </PageButton>
                ))}
                <PageButton
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  label="หน้าถัดไป"
                >
                  ›
                </PageButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceField({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex flex-1 items-center rounded-[9px] border-[1.5px] border-line bg-white px-2 focus-within:border-brand-teal">
      <span className="text-[13px] text-muted-foreground">฿</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-full bg-transparent py-1.5 pl-1 text-[13px] font-semibold text-ink outline-none"
        aria-label="ราคา"
      />
    </div>
  );
}

function PriceRange({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const [min, max] = value;
  const pct = (n: number) =>
    ((n - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  // Draft strings let the user clear/type freely; commit (clamp) on blur/Enter.
  const [draftMin, setDraftMin] = React.useState<string>(String(min));
  const [draftMax, setDraftMax] = React.useState<string>(String(max));

  React.useEffect(() => setDraftMin(String(min)), [min]);
  React.useEffect(() => setDraftMax(String(max)), [max]);

  const clamp = (n: number) =>
    Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round(n / PRICE_STEP) * PRICE_STEP));

  const commitMin = () => {
    const n = clamp(Number(draftMin) || PRICE_MIN);
    onChange([Math.min(n, max - PRICE_STEP), max]);
  };
  const commitMax = () => {
    const n = clamp(Number(draftMax) || PRICE_MAX);
    onChange([min, Math.max(n, min + PRICE_STEP)]);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <PriceField
          value={draftMin}
          onChange={setDraftMin}
          onCommit={commitMin}
        />
        <span className="text-muted-foreground">–</span>
        <PriceField
          value={draftMax}
          onChange={setDraftMax}
          onCommit={commitMax}
        />
      </div>

      <div className="relative h-5">
        {/* track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-line" />
        {/* selected range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-teal"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        {/* min handle */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={min}
          onChange={(e) =>
            onChange([Math.min(Number(e.target.value), max - PRICE_STEP), max])
          }
          className="sv-range absolute top-0 h-5 w-full"
          aria-label="ราคาต่ำสุด"
        />
        {/* max handle */}
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={max}
          onChange={(e) =>
            onChange([min, Math.max(Number(e.target.value), min + PRICE_STEP)])
          }
          className="sv-range absolute top-0 h-5 w-full"
          aria-label="ราคาสูงสุด"
        />
      </div>
    </div>
  );
}

function PageButton({
  children,
  active,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex size-10 items-center justify-center rounded-xl text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-40",
        active
          ? "bg-ink text-white"
          : "border-[1.5px] border-line bg-white text-ink hover:border-brand-teal"
      )}
    >
      {children}
    </button>
  );
}
