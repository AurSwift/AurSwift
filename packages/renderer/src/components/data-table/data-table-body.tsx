import { flexRender } from "@tanstack/react-table";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDataTableContext } from "./data-table-context";
import { DataTableEmpty } from "./data-table-empty";

interface DataTableBodyProps {
  renderEmpty?: () => React.ReactNode;
}

/**
 * DataTable Body component
 * Renders table rows
 * Used when you need custom rendering separate from Content
 */
export function DataTableBody({ renderEmpty }: DataTableBodyProps) {
  const { table } = useDataTableContext();
  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={table.getAllColumns().length} className="h-24">
            {renderEmpty ? renderEmpty() : <DataTableEmpty />}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
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
  );
}
