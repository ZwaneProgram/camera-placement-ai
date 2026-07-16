"use client";

import * as React from "react";
import { toast } from "sonner";

import { PRODUCT_TYPES, TYPE_LABEL, type DecoratedProduct } from "@/lib/products";

export function ProductForm({
  product,
  action,
}: {
  product?: DecoratedProduct;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const result = await action(new FormData(e.currentTarget));
    // A redirect() in the action throws NEXT_REDIRECT and never returns here;
    // reaching this line means validation failed.
    setPending(false);
    if (result?.error) toast.error(result.error);
  }

  const field =
    "h-11 rounded-xl border border-line px-4 text-sm outline-none focus:border-brand-teal";

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="flex max-w-[520px] flex-col gap-3">
      <input name="name" defaultValue={product?.name} placeholder="ชื่อสินค้า (ไทย)" required className={field} />
      <input name="en" defaultValue={product?.en} placeholder="ชื่อสินค้า (อังกฤษ)" required className={field} />
      <select name="type" defaultValue={product?.type ?? "cctv"} className={field}>
        {PRODUCT_TYPES.map((t) => (
          <option key={t} value={t}>{TYPE_LABEL[t]}</option>
        ))}
      </select>
      <input name="brand" defaultValue={product?.brand} placeholder="ยี่ห้อ" required className={field} />
      <input name="res" defaultValue={product?.res ?? "-"} placeholder="ความละเอียด (เช่น 4MP หรือ -)" className={field} />
      <input name="price" type="number" defaultValue={product?.price} placeholder="ราคา (บาท)" required className={field} />
      <input name="oldPrice" type="number" defaultValue={product?.old} placeholder="ราคาเดิม (ไม่บังคับ)" className={field} />
      <input name="rating" type="number" step="0.1" min="0" max="5" defaultValue={product?.rating ?? 0} placeholder="คะแนน (0-5)" className={field} />
      <input name="reviews" type="number" defaultValue={product?.reviews ?? 0} placeholder="จำนวนรีวิว" className={field} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input name="ai" type="checkbox" defaultChecked={product?.ai} /> รองรับฟีเจอร์ AI วางกล้อง
      </label>
      {product?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
      )}
      <input name="image" type="file" accept="image/*" className="text-sm" />
      <button disabled={pending} className="h-11 rounded-xl bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
