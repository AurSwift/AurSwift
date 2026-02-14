import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Data table mode for client vs server-side operations
 */
export type DataTableMode = "client" | "server";

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  mode: DataTableMode;
  pageSize?: number;
  pageIndex?: number;
  pageCount?: number;
  onPaginationChange?: (state: PaginationState) => void;
}

/**
 * Sorting configuration
 */
export interface SortingConfig {
  mode: DataTableMode;
  initialState?: SortingState;
  onSortingChange?: (state: SortingState) => void;
}

/**
 * Filtering configuration
 */
export interface FilteringConfig {
  mode: DataTableMode;
  globalFilter?: string;
  columnFilters?: ColumnFiltersState;
  onGlobalFilterChange?: (value: string) => void;
  onColumnFiltersChange?: (state: ColumnFiltersState) => void;
}

/**
 * Selection configuration
 */
export interface SelectionConfig {
  enabled: boolean;
  mode: "single" | "multiple";
  onSelectionChange?: (selectedRows: any[]) => void;
}

/**
 * Column visibility configuration
 */
export interface ColumnVisibilityConfig {
  initialState?: VisibilityState;
  storageKey?: string;
}

/**
 * Expandable rows configuration
 */
export interface ExpandableConfig<TData = any> {
  enabled: boolean;
  getRowCanExpand?: (row: Row<TData>) => boolean;
  renderSubComponent?: (row: Row<TData>) => React.ReactNode;
}

/**
 * Main data table options
 */
export interface UseDataTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  selection?: SelectionConfig;
  columnVisibility?: ColumnVisibilityConfig;
  expandable?: ExpandableConfig<TData>;
  enableColumnResizing?: boolean;
  enableRowVirtualization?: boolean;
  getRowId?: (row: TData, index: number) => string;
}

/**
 * Return type from useDataTable hook
 */
export interface UseDataTableReturn<TData> {
  table: Table<TData>;
  selectedRows: TData[];
  selectedCount: number;
}

/**
 * Filter option for faceted filters
 */
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Row action definition
 */
export interface RowAction<TData = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: (row: TData) => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

/**
 * Row action separator
 */
export interface RowActionSeparator {
  type: "separator";
}

/**
 * Combined row action type
 */
export type RowActionItem<TData = any> = RowAction<TData> | RowActionSeparator;

/**
 * Bulk action definition
 */
export interface BulkAction<TData = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onExecute: (rows: TData[]) => void | Promise<void>;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

/**
 * Export format
 */
export type ExportFormat = "csv" | "excel";

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  selectedOnly?: boolean;
}

/**
 * Column header props
 */
export interface ColumnHeaderProps {
  column: any; // TanStack column type
  title: string;
  className?: string;
}

/**
 * Data table context
 */
export interface DataTableContextValue<TData = any> {
  table: Table<TData>;
}
