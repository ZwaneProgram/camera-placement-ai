"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { deleteProductImage } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_TAG } from "@/lib/queries";
import { PRODUCT_TYPES, WARRANTY_UNITS, type ProductType } from "@/lib/products";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("ไม่ได้รับอนุญาต");
  }
}

type ParsedProduct = {
  name: string;
  en: string;
  type: ProductType;
  brand: string;
  res: string;
  price: number;
  oldPrice: number | null;
  ai: boolean;
  tags: string[];
  highlights: string[];
  description: string | null;
  specs: { k: string; v: string }[];
  warrantyValue: number | null;
  warrantyUnit: string | null;
};

function parseProductForm(formData: FormData): ParsedProduct | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const en = String(formData.get("en") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ProductType;
  const brand = String(formData.get("brand") ?? "").trim();
  const res = String(formData.get("res") ?? "-").trim() || "-";
  const price = Number(formData.get("price"));
  const oldRaw = String(formData.get("oldPrice") ?? "").trim();
  const oldPrice = oldRaw === "" ? null : Number(oldRaw);
  const ai = formData.get("ai") === "on";

  // Tags: comma-separated short chips. Empty by default (no auto tags).
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  // Highlights: one bullet per line in the textarea.
  const highlights = String(formData.get("highlights") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // Description: free text; empty = fall back to the auto template.
  const description = String(formData.get("description") ?? "").trim() || null;

  // Specs: "key: value" per line.
  const specs = String(formData.get("specs") ?? "")
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      return k && v ? { k, v } : null;
    })
    .filter((s): s is { k: string; v: string } => s !== null);

  // Warranty: a number + a unit (วัน / เดือน / ปี). Empty number = no warranty.
  const warrantyRaw = String(formData.get("warrantyValue") ?? "").trim();
  const warrantyValue = warrantyRaw === "" ? null : Number(warrantyRaw);
  const unitRaw = String(formData.get("warrantyUnit") ?? "ปี");
  const warrantyUnit = (WARRANTY_UNITS as readonly string[]).includes(unitRaw)
    ? unitRaw
    : "ปี";

  if (!name && !en)
    return { error: "กรุณากรอกชื่อสินค้าอย่างน้อย 1 ภาษา (ไทยหรืออังกฤษ)" };
  if (!PRODUCT_TYPES.includes(type)) return { error: "ประเภทสินค้าไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
    return { error: "ราคาเดิมไม่ถูกต้อง" };
  if (
    warrantyValue !== null &&
    (!Number.isInteger(warrantyValue) || warrantyValue < 0)
  )
    return { error: "ระยะเวลารับประกันไม่ถูกต้อง" };

  return {
    name,
    en,
    type,
    brand,
    res,
    price,
    oldPrice,
    ai,
    tags,
    highlights,
    description,
    specs,
    warrantyValue,
    warrantyUnit: warrantyValue !== null ? warrantyUnit : null,
  };
}

/**
 * Parse the ordered image URL list from the form. Files are uploaded to Vercel
 * Blob client-side (see app/api/blob-upload/route.ts), so by the time the form
 * hits this Server Action the `images` field is just a JSON array of blob URLs
 * in gallery order (index 0 = main image).
 */
function parseImageUrls(formData: FormData): string[] | { error: string } {
  const raw = formData.get("images");
  if (typeof raw !== "string" || raw === "") return [];
  try {
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.every((x) => typeof x === "string")) {
      return { error: "ข้อมูลรูปภาพไม่ถูกต้อง" };
    }
    return arr as string[];
  } catch {
    return { error: "ข้อมูลรูปภาพไม่ถูกต้อง" };
  }
}

function revalidateStorefront(id?: number) {
  // Bust the cached catalogue queries (lib/queries.ts) so edits show at once.
  // Next 16: revalidateTag needs a profile; `{ expire: 0 }` = immediate expiry.
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/products");
  if (id) revalidatePath(`/products/${id}`);
  revalidatePath("/admin");
}

export async function createProduct(
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  const urls = parseImageUrls(formData);
  if (!Array.isArray(urls)) return { error: urls.error };

  const created = await prisma.product.create({
    data: {
      ...parsed,
      specs: parsed.specs as Prisma.InputJsonValue,
      imageUrl: urls[0] ?? null,
      images: urls,
    },
  });
  revalidateStorefront(created.id);
  redirect("/admin");
}

export async function updateProduct(
  id: number,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "ไม่พบสินค้า" };

  const urls = parseImageUrls(formData);
  if (!Array.isArray(urls)) return { error: urls.error };

  // Delete blobs that were removed from the gallery.
  const kept = new Set(urls);
  const oldAll = new Set([
    ...existing.images,
    ...(existing.imageUrl ? [existing.imageUrl] : []),
  ]);
  for (const url of oldAll) {
    if (!kept.has(url)) await deleteProductImage(url);
  }

  await prisma.product.update({
    where: { id },
    data: {
      ...parsed,
      specs: parsed.specs as Prisma.InputJsonValue,
      imageUrl: urls[0] ?? null,
      images: urls,
    },
  });
  revalidateStorefront(id);
  redirect("/admin");
}

export async function deleteProduct(id: number): Promise<void> {
  await requireAdmin();
  const existing = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  if (existing) {
    const toDelete = new Set([
      ...existing.images,
      ...(existing.imageUrl ? [existing.imageUrl] : []),
    ]);
    for (const url of toDelete) await deleteProductImage(url);
  }
  revalidateStorefront(id);
}
