"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { uploadProductImage, deleteProductImage } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
import { PRODUCT_TYPES, type ProductType } from "@/lib/products";

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

  if (!name || !en || !brand) return { error: "กรุณากรอกข้อมูลให้ครบ" };
  if (!PRODUCT_TYPES.includes(type)) return { error: "ประเภทสินค้าไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
    return { error: "ราคาเดิมไม่ถูกต้อง" };

  return { name, en, type, brand, res, price, oldPrice, ai };
}

function revalidateStorefront(id?: number) {
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

  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let urls: string[] = [];
  if (files.length > 0) {
    try {
      urls = await Promise.all(files.map(uploadProductImage));
    } catch {
      return { error: "อัปโหลดรูปภาพไม่สำเร็จ" };
    }
  }
  const imageUrl = urls[0] ?? null;
  const created = await prisma.product.create({
    data: { ...parsed, imageUrl, images: urls },
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

  const newFiles = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let images: string[] = existing.images;
  let imageUrl: string | null = existing.imageUrl;

  if (newFiles.length > 0) {
    let urls: string[];
    try {
      urls = await Promise.all(newFiles.map(uploadProductImage));
    } catch {
      return { error: "อัปโหลดรูปภาพไม่สำเร็จ" };
    }
    // Delete all old blobs that are not in the new set
    const newSet = new Set(urls);
    const toDelete = new Set([
      ...existing.images,
      ...(existing.imageUrl ? [existing.imageUrl] : []),
    ]);
    for (const url of toDelete) {
      if (!newSet.has(url)) await deleteProductImage(url);
    }
    images = urls;
    imageUrl = urls[0] ?? null;
  }

  await prisma.product.update({
    where: { id },
    data: { ...parsed, imageUrl, images },
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
