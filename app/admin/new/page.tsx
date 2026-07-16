import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/actions";

export default function NewProductPage() {
  return <ProductForm action={createProduct} />;
}
