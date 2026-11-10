import { Skeleton } from "@/components/ui/skeleton";

/** Segnaposto per le pagine di dettaglio mentre il contenuto legato allo slug arriva. */
export function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="mt-8 h-12 w-full max-w-3xl" />
      <Skeleton className="mt-3 h-12 w-2/3 max-w-2xl" />
      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
        <Skeleton className="mx-auto aspect-9/16 w-full max-w-[320px] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-5 w-5/6 max-w-2xl" />
          <Skeleton className="h-5 w-4/6 max-w-2xl" />
        </div>
      </div>
    </div>
  );
}
