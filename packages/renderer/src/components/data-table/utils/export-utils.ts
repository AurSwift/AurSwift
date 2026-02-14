import type { Table } from "@tanstack/react-table";

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Format value for CSV (escape quotes and commas)
 */
export function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return "";
  
  const str = String(value);
  
  // Escape quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  
  // Wrap in quotes if contains comma, newline, or quote
  if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}

/**
 * Convert table data to CSV string
 */
export function tableToCSV<TData>(
  table: Table<TData>,
  options: {
    includeHeaders?: boolean;
    selectedOnly?: boolean;
    visibleColumnsOnly?: boolean;
  } = {},
): string {
  const {
    includeHeaders = true,
    selectedOnly = false,
    visibleColumnsOnly = true,
  } = options;

  // Get columns
  const columns = visibleColumnsOnly
    ? table.getVisibleLeafColumns()
    : table.getAllLeafColumns();

  // Filter out columns without header or accessorKey
  const exportableColumns = columns.filter(
    (col) => col.columnDef.header && col.id !== "select" && col.id !== "actions",
  );

  // Get rows
  const rows = selectedOnly
    ? table.getFilteredSelectedRowModel().rows
    : table.getFilteredRowModel().rows;

  const lines: string[] = [];

  // Add headers
  if (includeHeaders) {
    const headers = exportableColumns.map((col) => {
      const header = col.columnDef.header;
      return formatCSVValue(
        typeof header === "string" ? header : col.id,
      );
    });
    lines.push(headers.join(","));
  }

  // Add data rows
  for (const row of rows) {
    const values = exportableColumns.map((col) => {
      const cell = row.getValue(col.id);
      
      // Handle dates
      if (cell instanceof Date) {
        return formatCSVValue(formatDateForCSV(cell));
      }
      
      // Handle custom cell renderers
      if (typeof col.columnDef.cell === "function") {
        // Try to get the raw value
        const value = row.getValue(col.id);
        return formatCSVValue(value);
      }
      
      return formatCSVValue(cell);
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

/**
 * Download data as CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export table to CSV
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  filename: string,
  options?: {
    includeHeaders?: boolean;
    selectedOnly?: boolean;
    visibleColumnsOnly?: boolean;
  },
): void {
  const csv = tableToCSV(table, options);
  downloadCSV(csv, filename);
}

/**
 * Legacy export function for compatibility with existing code
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  headers: string[],
  filename: string,
): void {
  const lines: string[] = [];
  
  // Add headers
  lines.push(headers.map(formatCSVValue).join(","));
  
  // Add data
  for (const row of data) {
    const values = headers.map((header) => formatCSVValue(row[header] ?? ""));
    lines.push(values.join(","));
  }
  
  const csvContent = lines.join("\n");
  downloadCSV(csvContent, filename);
}
