/**
 * Data Table - Reusable table component system
 * Built on TanStack Table v8 with compound components
 */

// Main component
export { DataTable } from "./data-table";

// Context
export { useDataTableContext } from "./data-table-context";

// Hooks
export { useDataTable } from "./hooks/use-data-table";

// Components
export { DataTableToolbar } from "./data-table-toolbar";
export { DataTableContent } from "./data-table-content";
export { DataTableHeader } from "./data-table-header";
export { DataTableBody } from "./data-table-body";
export { DataTableFooter } from "./data-table-footer";
export { DataTablePagination } from "./data-table-pagination";
export { DataTableEmpty } from "./data-table-empty";
export { DataTableLoading } from "./data-table-loading";

// Filters
export { TableSearchInput } from "./filters/table-search-input";
export { TableFacetedFilter } from "./filters/table-faceted-filter";
export { TableDateRangeFilter } from "./filters/table-date-range-filter";

// Actions
export { TableRowActions } from "./actions/table-row-actions";
export { TableBulkActions } from "./actions/table-bulk-actions";
export { TableExportButton } from "./actions/table-export-button";

// Columns
export { ColumnHeader } from "./columns/column-header";
export { ColumnToggle } from "./columns/column-toggle";
export { columnHelpers } from "./columns/column-def-helpers.tsx";
export {
  createSelectionColumn,
  createTextColumn,
  createBadgeColumn,
  createDateColumn,
  createActionsColumn,
  createNumberColumn,
} from "./columns/column-def-helpers.tsx";

// Utils
export {
  exportTableToCSV,
  exportToCSV,
  tableToCSV,
  downloadCSV,
  formatCSVValue,
  formatDateForCSV,
} from "./utils/export-utils";
export {
  getAllRows,
  getSelectedRows,
  getRowCount,
  hasSelectedRows,
  allRowsSelected,
  getPageInfo,
  formatNumber,
} from "./utils/table-helpers";
export {
  DEFAULT_PAGINATION,
  DEFAULT_SORTING,
  DEFAULT_FILTERING,
  PAGE_SIZE_OPTIONS,
} from "./utils/table-config";

// Types
export type {
  UseDataTableOptions,
  UseDataTableReturn,
  DataTableMode,
  PaginationConfig,
  SortingConfig,
  FilteringConfig,
  SelectionConfig,
  ColumnVisibilityConfig,
  ExpandableConfig,
  FilterOption,
  RowAction,
  RowActionSeparator,
  RowActionItem,
  BulkAction,
  ExportFormat,
  ExportOptions,
  ColumnHeaderProps,
  DataTableContextValue,
} from "./types";
