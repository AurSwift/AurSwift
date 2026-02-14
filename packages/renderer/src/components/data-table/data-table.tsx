import type { Table } from "@tanstack/react-table";
import { cn } from "@/shared/utils/cn";
import { DataTableProvider } from "./data-table-context";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableContent } from "./data-table-content";
import { DataTableHeader } from "./data-table-header";
import { DataTableBody } from "./data-table-body";
import { DataTableFooter } from "./data-table-footer";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableEmpty } from "./data-table-empty";
import { DataTableLoading } from "./data-table-loading";

interface DataTableProps<TData> {
  table: Table<TData>;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

/**
 * Main DataTable compound component
 * Provides context and composition for table features
 * 
 * @example
 * ```tsx
 * <DataTable table={table}>
 *   <DataTable.Toolbar>
 *     <DataTable.SearchInput />
 *   </DataTable.Toolbar>
 *   <DataTable.Content />
 *   <DataTable.Footer>
 *     <DataTable.Pagination />
 *   </DataTable.Footer>
 * </DataTable>
 * ```
 */
export function DataTable<TData>({
  table,
  children,
  className,
  isLoading,
}: DataTableProps<TData>) {
  return (
    <DataTableProvider table={table}>
      <div
        className={cn(
          "rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col flex-1 min-h-0",
          className,
        )}
      >
        {isLoading ? <DataTableLoading /> : children}
      </div>
    </DataTableProvider>
  );
}

// Attach compound components
DataTable.Toolbar = DataTableToolbar;
DataTable.Content = DataTableContent;
DataTable.Header = DataTableHeader;
DataTable.Body = DataTableBody;
DataTable.Footer = DataTableFooter;
DataTable.Pagination = DataTablePagination;
DataTable.Empty = DataTableEmpty;
DataTable.Loading = DataTableLoading;
