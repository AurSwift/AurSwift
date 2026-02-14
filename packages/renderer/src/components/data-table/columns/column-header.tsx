import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/components/ui/button";

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

/**
 * Sortable column header component
 * Shows sort indicators and handles sorting
 */
export function ColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: ColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-3 h-8 data-[state=open]:bg-accent",
        "text-xs uppercase tracking-wide text-muted-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      <span>{title}</span>
      {sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ChevronsUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
