import { ListingView } from "@/components/listing/listing-view";
import { FILTERS, type FilterKey } from "@/lib/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const valid = FILTERS.some((f) => f.k === cat);
  const initialFilter = (valid ? cat : "all") as FilterKey;

  return <ListingView initialFilter={initialFilter} />;
}
