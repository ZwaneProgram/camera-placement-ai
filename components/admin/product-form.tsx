"use client";

import * as React from "react";
import Link from "next/link";
import { GripVertical, ImagePlus, Move, Save, Sparkles, X } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PRODUCT_TYPES,
  TYPE_LABEL,
  WARRANTY_UNITS,
  productSpecs,
  type DecoratedProduct,
} from "@/lib/products";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand-teal focus:ring-[3px] focus:ring-brand-teal/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">
        {label}
        {hint && (
          <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

type GalleryItem = { key: string; url: string; file?: File };

export function ProductForm({
  product,
  action,
}: {
  product?: DecoratedProduct;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [pending, setPending] = React.useState(false);

  // Ordered gallery: existing DB images first, then any newly added files.
  // items[0] is always the main image; the rest are sub-images.
  const [items, setItems] = React.useState<GalleryItem[]>(() => {
    const init = product?.images?.length
      ? product.images
      : product?.imageUrl
        ? [product.imageUrl]
        : [];
    return init.map((url, i) => ({ key: `db-${i}-${url}`, url }));
  });

  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const dragIndex = React.useRef<number | null>(null);

  // Revoke object URLs created for newly added files on unmount.
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  React.useEffect(
    () => () => {
      itemsRef.current.forEach((it) => {
        if (it.file && it.url.startsWith("blob:")) URL.revokeObjectURL(it.url);
      });
    },
    []
  );

  function onAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setItems((prev) => [
      ...prev,
      ...files.map((f, i) => ({
        key: `new-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(f),
        file: f,
      })),
    ]);
    e.target.value = ""; // allow re-picking the same file
  }

  function onRemove(key: string) {
    setItems((prev) => {
      const it = prev.find((x) => x.key === key);
      if (it?.file && it.url.startsWith("blob:")) URL.revokeObjectURL(it.url);
      return prev.filter((x) => x.key !== key);
    });
  }

  function onDropAt(idx: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIdx(null);
    setDraggingIdx(null);
    if (from === null || from === idx) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);

    // Upload any newly added files straight to Vercel Blob (bypasses the
    // Server Action body limit), keeping gallery order. Existing images
    // already have a url and are passed through untouched.
    let urls: string[];
    try {
      urls = [];
      for (const it of items) {
        if (it.file) {
          const blob = await upload(`products/${it.file.name}`, it.file, {
            access: "public",
            handleUploadUrl: "/api/blob-upload",
          });
          urls.push(blob.url);
        } else {
          urls.push(it.url);
        }
      }
    } catch {
      setPending(false);
      toast.error("อัปโหลดรูปภาพไม่สำเร็จ");
      return;
    }

    fd.set("images", JSON.stringify(urls));
    const result = await action(fd);
    // A redirect() in the action throws NEXT_REDIRECT and never returns here;
    // reaching this line means validation failed.
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  const specsDefault = (product ? productSpecs(product) : [])
    .map((s) => `${s.k}: ${s.v}`)
    .join("\n");

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="flex flex-col gap-5 pb-24"
    >
      {/* Product info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="ชื่อสินค้า" hint="ภาษาไทย · กรอกอย่างน้อย 1 ภาษา">
              <input
                name="name"
                defaultValue={product?.name}
                placeholder="เช่น กล้องวงจรปิด 4MP"
                className={fieldCls}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="ชื่อสินค้า" hint="ภาษาอังกฤษ · กรอกอย่างน้อย 1 ภาษา">
              <input
                name="en"
                defaultValue={product?.en}
                placeholder="e.g. 4MP Security Camera"
                className={fieldCls}
              />
            </Field>
          </div>
          <Field label="ประเภท">
            <div className="relative">
              <select
                name="type"
                defaultValue={product?.type ?? "cctv"}
                className={`${fieldCls} appearance-none pr-9`}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                ▾
              </span>
            </div>
          </Field>
          <Field label="ยี่ห้อ" hint="ไม่บังคับ">
            <input
              name="brand"
              defaultValue={product?.brand}
              placeholder="เช่น Hikvision"
              className={fieldCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="ความละเอียด" hint="เช่น 4MP หรือ - ถ้าไม่มี">
              <input
                name="res"
                defaultValue={product?.res ?? "-"}
                placeholder="4MP"
                className={fieldCls}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="แท็ก" hint="คั่นด้วยจุลภาค (,) · เว้นว่างได้">
              <input
                name="tags"
                defaultValue={product?.tags?.join(", ")}
                placeholder="เช่น ไร้สาย, กันน้ำ, ดูผ่านมือถือ"
                className={fieldCls}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ราคา</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ราคา" hint="บาท">
            <input
              name="price"
              type="number"
              defaultValue={product?.price}
              placeholder="1290"
              required
              className={fieldCls}
            />
          </Field>
          <Field label="ราคาเดิม" hint="ไม่บังคับ">
            <input
              name="oldPrice"
              type="number"
              defaultValue={product?.old}
              placeholder="1590"
              className={fieldCls}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Highlights & warranty */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">จุดเด่นและการรับประกัน</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="จุดเด่นสินค้า" hint="พิมพ์บรรทัดละ 1 ข้อ">
            <textarea
              name="highlights"
              defaultValue={product?.highlights?.join("\n")}
              placeholder={
                "เชื่อมต่อไร้สาย ติดตั้งเองได้ง่าย\nแบตเตอรี่ใช้งานยาวนาน\nแจ้งเตือนทันทีเมื่อพบการเคลื่อนไหว"
              }
              rows={4}
              className={cn(fieldCls, "h-auto resize-y py-3 leading-relaxed")}
            />
          </Field>
          <Field label="การรับประกัน" hint="เว้นว่างถ้าไม่มี">
            <div className="flex gap-2.5">
              <input
                name="warrantyValue"
                type="number"
                min={0}
                defaultValue={product?.warrantyValue ?? ""}
                placeholder="2"
                className={cn(fieldCls, "flex-1")}
              />
              <div className="relative w-32 shrink-0">
                <select
                  name="warrantyUnit"
                  defaultValue={product?.warrantyUnit ?? "ปี"}
                  className={cn(fieldCls, "appearance-none pr-9")}
                >
                  {WARRANTY_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ▾
                </span>
              </div>
            </div>
          </Field>
        </CardContent>
      </Card>

      {/* Description & specs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายละเอียดและสเปค</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="รายละเอียดสินค้า" hint="เว้นว่าง = ใช้ข้อความอัตโนมัติตามประเภท">
            <textarea
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="อธิบายรายละเอียดสินค้า จุดเด่น การใช้งาน…"
              rows={4}
              className={cn(fieldCls, "h-auto resize-y py-3 leading-relaxed")}
            />
          </Field>
          <Field label="สเปคสินค้า" hint="บรรทัดละ 1 รายการ">
            <textarea
              name="specs"
              defaultValue={specsDefault}
              placeholder={"ยี่ห้อ: AjaxLite\nประเภท: เซ็นเซอร์\nความละเอียด: 4MP"}
              rows={5}
              className={cn(
                fieldCls,
                "h-auto resize-y py-3 font-mono text-[13px] leading-relaxed"
              )}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Media & features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รูปภาพและฟีเจอร์</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">รูปสินค้า</span>
              {items.length > 1 ? (
                <span className="flex items-center gap-1 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[12px] font-medium text-brand-blue">
                  <Move className="size-3.5 animate-pulse" />
                  ลากรูปเพื่อจัดลำดับ
                </span>
              ) : items.length === 1 ? (
                <span className="text-[12px] text-muted-foreground">1 รูป</span>
              ) : null}
            </div>

            {/* Draggable gallery — item 0 is the main image; trailing tile adds more */}
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {items.map((it, idx) => (
                <div
                  key={it.key}
                  draggable
                  onDragStart={() => {
                    dragIndex.current = idx;
                    setDraggingIdx(idx);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDragLeave={() => setDragOverIdx((cur) => (cur === idx ? null : cur))}
                  onDrop={() => onDropAt(idx)}
                  onDragEnd={() => {
                    dragIndex.current = null;
                    setDragOverIdx(null);
                    setDraggingIdx(null);
                  }}
                  className={cn(
                    "group relative aspect-square cursor-grab overflow-hidden rounded-xl border bg-white transition-all duration-200 ease-out will-change-transform active:cursor-grabbing",
                    idx === 0
                      ? "border-brand-teal ring-2 ring-brand-teal/25"
                      : "border-line",
                    draggingIdx === idx && "scale-90 opacity-40",
                    dragOverIdx === idx &&
                      draggingIdx !== idx &&
                      "z-10 scale-105 border-brand-blue ring-2 ring-brand-blue shadow-[0_12px_28px_rgba(47,107,255,.30)]"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.url}
                    alt={`รูปที่ ${idx + 1}`}
                    className="pointer-events-none size-full object-cover"
                  />
                  {idx === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-teal px-1.5 py-0.5 text-[10px] font-bold leading-none text-ink shadow-sm">
                      รูปหลัก
                    </span>
                  ) : (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm backdrop-blur-[2px]">
                      รูปย่อย
                    </span>
                  )}
                  {/* Drag handle affordance */}
                  <span className="pointer-events-none absolute bottom-1 left-1 flex items-center rounded-md bg-ink/55 px-1 py-0.5 text-white opacity-70 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(it.key)}
                    aria-label="ลบรูป"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-ink/60 text-white opacity-0 transition-opacity hover:bg-ink group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}

              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-surface/50 text-muted-foreground transition-colors hover:border-brand-teal hover:text-brand-teal">
                <ImagePlus className="size-6" />
                <span className="px-1 text-center text-[11px] font-medium leading-tight">
                  เพิ่มรูป
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onAddImages}
                  className="sr-only"
                />
              </label>
            </div>

            <p className="text-[11px] text-muted-foreground">
              PNG, JPG หรือ WebP · กด “เพิ่มรูป” เพื่อเพิ่มได้หลายรูป · ลากรูปไปตำแหน่งแรกเพื่อตั้งเป็นรูปหลัก · กด × เพื่อลบ
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5">
            <span className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal">
                <Sparkles className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-ink">
                  รองรับ AI วางกล้อง
                </span>
                <span className="text-xs text-muted-foreground">
                  แสดงตราสัญลักษณ์ AI บนหน้าสินค้า
                </span>
              </span>
            </span>
            <input
              name="ai"
              type="checkbox"
              defaultChecked={product?.ai}
              className="size-5 accent-brand-blue"
            />
          </label>
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-white/85 p-3 shadow-[0_10px_30px_rgba(14,27,42,.10)] backdrop-blur">
        <Button asChild variant="soft" type="button">
          <Link href="/admin">ยกเลิก</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "กำลังบันทึก…" : "บันทึกสินค้า"}
        </Button>
      </div>
    </form>
  );
}
