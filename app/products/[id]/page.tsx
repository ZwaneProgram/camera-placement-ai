import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/detail/product-detail";
import { PRODUCTS, getProduct } from "@/lib/products";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: String(p.id) }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(Number(id));
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
