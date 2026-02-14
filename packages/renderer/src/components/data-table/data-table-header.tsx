import { flexRender } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataTableContext } from "./data-table-context";

/**
 * DataTable Header component
 * Renders table header with columns
 * Used when you need custom rendering separate from Content
 */
export function DataTableHeader() {
  const { table } = useDataTableContext();

  return (
    <TableHeader className="sticky top-0 z-10 bg-background">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="bg-background">
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
