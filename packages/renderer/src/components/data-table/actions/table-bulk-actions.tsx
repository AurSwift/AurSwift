import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/shared/utils/cn";
import { useDataTableContext } from "../data-table-context";
import type { BulkAction } from "../types";

interface TableBulkActionsProps<TData> {
  actions: BulkAction<TData>[];
  className?: string;
}

/**
 * Table bulk actions toolbar component
 * Shows when rows are selected, provides bulk operations
 */
export function TableBulkActions<TData>({
  actions,
  className,
}: TableBulkActionsProps<TData>) {
  const { table } = useDataTableContext<TData>();
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const selectedCount = selectedRows.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 sm:px-4 py-2 border-b bg-muted/50",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => table.resetRowSelection()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant === "destructive" ? "destructive" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => action.onExecute(selectedRows)}
            disabled={action.disabled}
          >
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
