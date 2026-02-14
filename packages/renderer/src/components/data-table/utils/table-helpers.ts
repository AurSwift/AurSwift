import type { Row, Table } from "@tanstack/react-table";

/**
 * Get all rows (filtered or unfiltered)
 */
export function getAllRows<TData>(table: Table<TData>): Row<TData>[] {
  return table.getFilteredRowModel().rows;
}

/**
 * Get selected rows
 */
export function getSelectedRows<TData>(table: Table<TData>): TData[] {
  return table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
}

/**
 * Get row count
 */
export function getRowCount<TData>(table: Table<TData>): number {
  return table.getFilteredRowModel().rows.length;
}

/**
 * Check if any rows are selected
 */
export function hasSelectedRows<TData>(table: Table<TData>): boolean {
  return table.getFilteredSelectedRowModel().rows.length > 0;
}

/**
 * Check if all rows are selected
 */
export function allRowsSelected<TData>(table: Table<TData>): boolean {
  const filtered = table.getFilteredRowModel().rows;
  const selected = table.getFilteredSelectedRowModel().rows;
  return filtered.length > 0 && filtered.length === selected.length;
}

/**
 * Get page info string (e.g., "1-10 of 100")
 */
export function getPageInfo(
  currentPage: number,
  pageSize: number,
  totalItems: number,
): string {
  if (totalItems === 0) return "0-0 of 0";
  
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);
  
  return `${start}-${end} of ${totalItems}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Safely get nested property value
 */
export function getNestedValue<T>(obj: T, path: string): any {
  return path.split(".").reduce((acc: any, part) => acc?.[part], obj);
}
