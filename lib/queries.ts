import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { decorate, type DecoratedProduct } from "@/lib/products";

/**
 * Cache tag for all catalogue reads. Admin mutations call
 * `revalidateTag(PRODUCTS_TAG)` so edits show up immediately; the `revalidate`
 * window below is only a safety net if a mutation ever misses invalidation.
 */
export const PRODUCTS_TAG = "products";
const REVALIDATE_SECONDS = 300;

// Only cache in production. In development we always read fresh from the DB so
// admin edits / seed changes show immediately (unstable_cache otherwise
// persists stale data across requests even in dev).
const useCache = process.env.NODE_ENV === "production";

async function readAllProducts(): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({ orderBy: { id: "asc" } });
  return rows.map(decorate);
}

async function readProduct(id: number): Promise<DecoratedProduct | null> {
  if (!Number.isInteger(id)) return null;
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? decorate(row) : null;
}

async function readBestSellers(n = 4): Promise<DecoratedProduct[]> {
  const rows = await prisma.product.findMany({
    orderBy: { rating: "desc" },
    take: n,
  });
  return rows.map(decorate);
}

async function readTypeCounts(): Promise<Record<string, number>> {
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

const opts = { tags: [PRODUCTS_TAG], revalidate: REVALIDATE_SECONDS };

export const getAllProducts = useCache
  ? unstable_cache(readAllProducts, ["getAllProducts"], opts)
  : readAllProducts;

export const getProduct = useCache
  ? unstable_cache(readProduct, ["getProduct"], opts)
  : readProduct;

export const bestSellers = useCache
  ? unstable_cache(readBestSellers, ["bestSellers"], opts)
  : readBestSellers;

export const typeCounts = useCache
  ? unstable_cache(readTypeCounts, ["typeCounts"], opts)
  : readTypeCounts;
