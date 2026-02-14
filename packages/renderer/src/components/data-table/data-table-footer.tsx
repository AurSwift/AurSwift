import { cn } from "@/shared/utils/cn";
import { useDataTableContext } from "./data-table-context";

interface DataTableFooterProps {
  children: React.ReactNode;
  className?: string;
  showSelectionInfo?: boolean;
}

/**
 * DataTable Footer component
 * Container for pagination and selection info
 */
export function DataTableFooter({
  children,
  className,
  showSelectionInfo = true,
}: DataTableFooterProps) {
  const { table } = useDataTableContext();
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div className={cn("border-t bg-background shrink-0", className)}>
      {showSelectionInfo && (
        <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground flex items-center justify-between gap-3">
          <span>
            {selectedCount} of {totalCount} row(s) selected
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
