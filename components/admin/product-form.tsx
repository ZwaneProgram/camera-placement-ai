"use client";

import * as React from "react";
import Link from "next/link";
import { ImagePlus, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_TYPES, TYPE_LABEL, type DecoratedProduct } from "@/lib/products";

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

export function ProductForm({
  product,
  action,
}: {
  product?: DecoratedProduct;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [pending, setPending] = React.useState(false);
  // List of object-URL strings for the newly selected files. Empty = no new selection.
  const [newPreviews, setNewPreviews] = React.useState<string[]>([]);

  // Existing gallery derived from the product prop (stable reference).
  const existingGallery = React.useMemo<string[]>(() => {
    if (product?.images?.length) return product.images;
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  }, [product]);

  // Revoke all blob URLs we created when they change or on unmount.
  React.useEffect(() => {
    return () => {
      newPreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPreviews]);

  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    // Revoke previous object URLs before creating new ones.
    newPreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    const files = Array.from(e.target.files ?? []);
    setNewPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await action(new FormData(e.currentTarget));
    // A redirect() in the action throws NEXT_REDIRECT and never returns here;
    // reaching this line means validation failed.
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  // Thumbnails to render: prefer newly selected previews, else the existing gallery.
  const thumbnails = newPreviews.length > 0 ? newPreviews : existingGallery;
  const isNewSelection = newPreviews.length > 0;

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
            <Field label="ชื่อสินค้า" hint="ภาษาไทย">
              <input
                name="name"
                defaultValue={product?.name}
                placeholder="เช่น กล้องวงจรปิด 4MP"
                required
                className={fieldCls}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="ชื่อสินค้า" hint="ภาษาอังกฤษ">
              <input
                name="en"
                defaultValue={product?.en}
                placeholder="e.g. 4MP Security Camera"
                required
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
          <Field label="ยี่ห้อ">
            <input
              name="brand"
              defaultValue={product?.brand}
              placeholder="เช่น Hikvision"
              required
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

      {/* Media & features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รูปภาพและฟีเจอร์</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">รูปสินค้า</span>
              {isNewSelection && (
                <span className="text-[12px] text-brand-teal font-medium">
                  เลือก {newPreviews.length} รูป
                </span>
              )}
            </div>

            {/* Dropzone trigger */}
            <label className="group flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-line bg-surface/50 p-3 transition-colors hover:border-brand-teal">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                {thumbnails.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnails[0]}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="sv-hatch flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-5" />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-ink">
                  {thumbnails.length > 0 ? "เปลี่ยนรูปภาพ" : "อัปโหลดรูปภาพ"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  PNG, JPG หรือ WebP · เลือกได้หลายรูป
                </span>
              </div>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImages}
                className="sr-only"
              />
            </label>

            {/* Replace-all hint */}
            <p className="text-[11px] text-muted-foreground">
              อัปโหลดรูปใหม่จะแทนที่รูปทั้งหมด · รูปแรกจะเป็นรูปหลัก
            </p>

            {/* Thumbnail grid — shown when there are any images to preview */}
            {thumbnails.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-muted-foreground">
                  {isNewSelection
                    ? "ตัวอย่างรูปที่เลือก"
                    : "แกลเลอรีปัจจุบัน"}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {thumbnails.map((src, idx) => (
                    <div
                      key={src}
                      className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`รูปที่ ${idx + 1}`}
                        className="size-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-brand-teal/90 px-1 py-0.5 text-[10px] font-semibold text-white leading-none">
                          รูปหลัก
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
