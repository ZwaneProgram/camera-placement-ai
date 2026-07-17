import Image from "next/image";
import Link from "next/link";
import { PackagePlus, Pencil, ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { getAllProducts } from "@/lib/queries";
import { formatBaht } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-ink">สินค้า</h2>
          <Badge variant="outline">{products.length} รายการ</Badge>
        </div>
        <Button asChild>
          <Link href="/admin/new">
            <PackagePlus className="size-4" />
            เพิ่มสินค้า
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-[13px] font-semibold text-muted-foreground">
                  <th className="p-4 font-semibold">สินค้า</th>
                  <th className="p-4 font-semibold">ประเภท</th>
                  <th className="p-4 font-semibold text-right">ราคา</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-line last:border-0 transition-colors hover:bg-surface/60"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-line">
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt={p.name}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="sv-hatch flex size-full items-center justify-center text-muted-foreground">
                              <ImageOff className="size-4" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-ink">
                              {p.name}
                            </span>
                            {p.ai && <Badge variant="ai">AI</Badge>}
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {p.en}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{p.typeLabel}</Badge>
                    </td>
                    <td className="p-4 text-right font-semibold tabular-nums text-ink">
                      {formatBaht(p.price)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-brand-blue hover:text-brand-blue"
                        >
                          <Link href={`/admin/${p.id}/edit`}>
                            <Pencil className="size-3.5" />
                            แก้ไข
                          </Link>
                        </Button>
                        <ProductRowActions id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-line-soft text-brand-blue">
        <PackagePlus className="size-7" />
      </div>
      <h3 className="mt-4 font-bold text-ink">ยังไม่มีสินค้า</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        เริ่มต้นด้วยการเพิ่มสินค้าชิ้นแรกเข้าสู่แคตตาล็อกของร้าน
      </p>
      <Button asChild className="mt-5">
        <Link href="/admin/new">
          <PackagePlus className="size-4" />
          เพิ่มสินค้าชิ้นแรก
        </Link>
      </Button>
    </div>
  );
}
