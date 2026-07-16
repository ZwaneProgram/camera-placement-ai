import Link from "next/link";

import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/actions";

export default function NewProductPage() {
  return (
    <div>
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/admin" className="font-semibold text-brand-blue hover:underline">
          สินค้า
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">เพิ่มสินค้า</span>
      </nav>
      <ProductForm action={createProduct} />
    </div>
  );
}
