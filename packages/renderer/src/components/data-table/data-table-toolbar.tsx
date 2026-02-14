import { cn } from "@/shared/utils/cn";

interface DataTableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DataTable Toolbar component
 * Container for filters, search, and toolbar actions
 */
export function DataTableToolbar({
  children,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2 border-b bg-muted/20 shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
