import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton mirroring the product detail layout (gallery + info). */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] animate-sv-fade px-5 pt-7 pb-15">
      <Skeleton className="mb-[18px] h-4 w-64" />
      <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/3] w-full rounded-[20px]" />
          <div className="flex gap-2.5">
            <Skeleton className="size-20 rounded-xl sm:size-24" />
            <Skeleton className="size-20 rounded-xl sm:size-24" />
            <Skeleton className="size-20 rounded-xl sm:size-24" />
          </div>
        </div>

        {/* Info */}
        <div>
          <Skeleton className="mb-3 h-6 w-24 rounded-full" />
          <Skeleton className="mb-2 h-9 w-3/4" />
          <Skeleton className="mb-[18px] h-4 w-40" />
          <Skeleton className="mb-[22px] h-10 w-48" />
          <div className="mb-6 flex flex-col gap-2.5">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-60" />
            <Skeleton className="h-4 w-52" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-13 w-32 rounded-xl" />
            <Skeleton className="h-13 flex-1 rounded-[14px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
