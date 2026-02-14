import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDataTableContext } from "../data-table-context";
import { cn } from "@/shared/utils/cn";

interface TableSearchInputProps {
  placeholder?: string;
  className?: string;
  column?: string; // Optional: filter specific column instead of global
}

/**
 * Table search input component
 * Filters table data by search term
 */
export function TableSearchInput({
  placeholder = "Search...",
  className,
  column,
}: TableSearchInputProps) {
  const { table } = useDataTableContext();

  const value = column
    ? (table.getColumn(column)?.getFilterValue() as string) ?? ""
    : (table.getState().globalFilter as string) ?? "";

  const setValue = (newValue: string) => {
    if (column) {
      table.getColumn(column)?.setFilterValue(newValue);
    } else {
      table.setGlobalFilter(newValue);
    }
  };

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-8 pr-8 h-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => setValue("")}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
}
