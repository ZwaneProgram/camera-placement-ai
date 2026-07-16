import Link from "next/link";

import { getAllProducts } from "@/lib/queries";
import { formatBaht } from "@/lib/utils";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href="/admin/new" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold leading-10 text-white">
          + เพิ่มสินค้า
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-muted-foreground">
            <tr>
              <th className="p-3">ชื่อ</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">ราคา</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="p-3 font-semibold text-ink">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.typeLabel}</td>
                <td className="p-3">{formatBaht(p.price)}</td>
                <td className="flex justify-end gap-3 p-3">
                  <Link href={`/admin/${p.id}/edit`} className="text-sm font-semibold text-brand-blue">แก้ไข</Link>
                  <ProductRowActions id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
