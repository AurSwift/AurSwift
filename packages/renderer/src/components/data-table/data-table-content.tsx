import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/utils/cn";
import { useDataTableContext } from "./data-table-context";
import { DataTableEmpty } from "./data-table-empty";

interface DataTableContentProps {
  className?: string;
  minWidth?: string;
  renderEmpty?: () => React.ReactNode;
}

/**
 * DataTable Content component
 * Renders the table with header and body
 * Provides default rendering using TanStack Table's flexRender
 */
export function DataTableContent({
  className,
  minWidth = "760px",
  renderEmpty,
}: DataTableContentProps) {
  const { table } = useDataTableContext();
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex-1">
        {renderEmpty ? renderEmpty() : <DataTableEmpty />}
      </div>
    );
  }

  return (
    <div className={cn("w-full flex-1 min-h-0 flex flex-col", className)}>
      <div className="flex-1 min-h-0 overflow-auto">
        <Table className={cn("min-w-[" + minWidth + "]", "min-w-[760px]")}>
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
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
