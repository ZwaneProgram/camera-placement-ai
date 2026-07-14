import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/detail/product-detail";
import { getProduct } from "@/lib/queries";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
