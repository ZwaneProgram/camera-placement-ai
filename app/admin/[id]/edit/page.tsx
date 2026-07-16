import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/app/admin/actions";
import { getProduct } from "@/lib/queries";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  const product = await getProduct(productId);
  if (!product) notFound();

  const action = updateProduct.bind(null, productId);
  return <ProductForm product={product} action={action} />;
}
