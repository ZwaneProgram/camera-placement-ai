import { put, del } from "@vercel/blob";

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = await put(key, file, { access: "public" });
  return blob.url;
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    /* already gone — non-fatal */
  }
}
