import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";

interface DataTableLoadingProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * DataTable Loading state component
 * Shows skeleton loader while data is loading
 */
export function DataTableLoading({
  rows = 5,
  columns = 4,
  className,
}: DataTableLoadingProps) {
  return (
    <div className={cn("w-full p-4", className)}>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-[100px]" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {/* Header row */}
        <div className="flex gap-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-10 flex-1" />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-16 flex-1" />
            ))}
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
