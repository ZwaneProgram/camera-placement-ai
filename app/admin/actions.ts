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
  rating: number;
  reviews: number;
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
  const rating = Number(formData.get("rating") ?? 0);
  const reviews = Number(formData.get("reviews") ?? 0);
  const ai = formData.get("ai") === "on";

  if (!name || !en || !brand) return { error: "กรุณากรอกข้อมูลให้ครบ" };
  if (!PRODUCT_TYPES.includes(type)) return { error: "ประเภทสินค้าไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0))
    return { error: "ราคาเดิมไม่ถูกต้อง" };

  return { name, en, type, brand, res, price, oldPrice, rating, reviews, ai };
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

  const image = formData.get("image");
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage(image);
  }
  const created = await prisma.product.create({ data: { ...parsed, imageUrl } });
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

  const image = formData.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File && image.size > 0) {
    imageUrl = await uploadProductImage(image);
    if (existing.imageUrl) await deleteProductImage(existing.imageUrl);
  }
  await prisma.product.update({ where: { id }, data: { ...parsed, imageUrl } });
  revalidateStorefront(id);
  redirect("/admin");
}

export async function deleteProduct(id: number): Promise<void> {
  await requireAdmin();
  const existing = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  if (existing?.imageUrl) await deleteProductImage(existing.imageUrl);
  revalidateStorefront(id);
}
