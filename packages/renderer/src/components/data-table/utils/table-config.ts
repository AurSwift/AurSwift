import type { PaginationConfig, SortingConfig, FilteringConfig } from "../types";

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION: Required<Omit<PaginationConfig, "onPaginationChange">> = {
  mode: "client",
  pageSize: 10,
  pageIndex: 0,
  pageCount: -1,
};

/**
 * Default sorting configuration
 */
export const DEFAULT_SORTING: SortingConfig = {
  mode: "client",
  initialState: [],
};

/**
 * Default filtering configuration
 */
export const DEFAULT_FILTERING: FilteringConfig = {
  mode: "client",
  globalFilter: "",
  columnFilters: [],
};

/**
 * Page size options for pagination
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;

/**
 * Default column visibility storage key prefix
 */
export const COLUMN_VISIBILITY_STORAGE_KEY_PREFIX = "data-table-columns";
