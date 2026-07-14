import { ListingView } from "@/components/listing/listing-view";
import { FILTERS, type FilterKey } from "@/lib/products";
import { getAllProducts, typeCounts } from "@/lib/queries";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const valid = FILTERS.some((f) => f.k === cat);
  const initialFilter = (valid ? cat : "all") as FilterKey;

  const [products, counts] = await Promise.all([
    getAllProducts(),
    typeCounts(),
  ]);

  return (
    <ListingView
      initialFilter={initialFilter}
      products={products}
      counts={counts}
    />
  );
}
