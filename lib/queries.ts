import { prisma } from "@/lib/prisma";
import { decorate, type DecoratedProduct } from "@/lib/products";

export async function getAllProducts(): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return rows.map(decorate);
}

export async function getProduct(id: number): Promise<DecoratedProduct | null> {
  if (!Number.isInteger(id)) return null;
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? decorate(row) : null;
}

export async function bestSellers(n = 4): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: { rating: "desc" },
    take: n,
  });
  return rows.map(decorate);
}

export async function typeCounts(): Promise<Record<string, number>> {
  const grouped = await prisma.product.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  let all = 0;
  for (const g of grouped) {
    counts[g.type] = g._count._all;
    all += g._count._all;
  }
  counts.all = all;
  return counts;
}
