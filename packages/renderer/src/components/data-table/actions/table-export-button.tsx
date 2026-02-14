import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataTableContext } from "../data-table-context";
import { exportTableToCSV } from "../utils/export-utils";
import type { ExportFormat } from "../types";

interface TableExportButtonProps {
  filename?: string;
  formats?: ExportFormat[];
  className?: string;
}

/**
 * Table export button component
 * Exports table data to various formats
 */
export function TableExportButton({
  filename = "export",
  formats = ["csv"],
  className,
}: TableExportButtonProps) {
  const { table } = useDataTableContext();
  const hasSelectedRows = table.getFilteredSelectedRowModel().rows.length > 0;

  const handleExport = (format: ExportFormat, onlySelected: boolean) => {
    const timestamp = new Date().toISOString().split("T")[0];
    const exportFilename = `${filename}-${timestamp}`;

    if (format === "csv") {
      exportTableToCSV(table, exportFilename, {
        includeHeaders: true,
        selectedOnly: onlySelected,
        visibleColumnsOnly: true,
      });
    } else if (format === "excel") {
      // TODO: Implement Excel export
      console.warn("Excel export not yet implemented");
    }
  };

  // Simple button if only one format and no selection
  if (formats.length === 1 && !hasSelectedRows) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => handleExport(formats[0], false)}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {formats.includes("csv") && (
          <DropdownMenuItem onSelect={() => handleExport("csv", false)}>
            CSV - All rows
          </DropdownMenuItem>
        )}
        
        {hasSelectedRows && formats.includes("csv") && (
          <DropdownMenuItem onSelect={() => handleExport("csv", true)}>
            CSV - Selected rows
          </DropdownMenuItem>
        )}
        
        {formats.includes("excel") && (
          <>
            <DropdownMenuItem onSelect={() => handleExport("excel", false)}>
              Excel - All rows
            </DropdownMenuItem>
            {hasSelectedRows && (
              <DropdownMenuItem onSelect={() => handleExport("excel", true)}>
                Excel - Selected rows
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
