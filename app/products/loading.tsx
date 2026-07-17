import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the product listing grid while the catalogue loads. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1240px] animate-sv-fade px-5 pt-7 pb-15">
      <Skeleton className="mb-2 h-8 w-56" />
      <Skeleton className="mb-8 h-4 w-72" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line p-3">
            <Skeleton className="mb-3 aspect-square w-full rounded-xl" />
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="mb-3 h-3 w-1/2" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
