import { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ExpandedState,
} from "@tanstack/react-table";
import type { UseDataTableOptions, UseDataTableReturn } from "../types";

/**
 * Main data table hook that wraps TanStack Table
 * Provides unified interface for client and server-side operations
 * 
 * @example
 * ```tsx
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns,
 *   pagination: { mode: 'client', pageSize: 10 },
 *   sorting: { mode: 'client' },
 *   selection: { enabled: true, mode: 'multiple' },
 * });
 * ```
 */
export function useDataTable<TData>({
  data,
  columns,
  pagination,
  sorting,
  filtering,
  selection,
  columnVisibility,
  expandable,
  enableColumnResizing = false,
  getRowId,
}: UseDataTableOptions<TData>): UseDataTableReturn<TData> {
  // ==================== State Management ====================
  
  // Pagination state
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: pagination?.pageIndex ?? 0,
    pageSize: pagination?.pageSize ?? 10,
  });

  // Sorting state
  const [sortingState, setSortingState] = useState<SortingState>(
    sorting?.initialState ?? [],
  );

  // Column filters state
  const [columnFiltersState, setColumnFiltersState] =
    useState<ColumnFiltersState>(filtering?.columnFilters ?? []);

  // Global filter state
  const [globalFilterState, setGlobalFilterState] = useState<string>(
    filtering?.globalFilter ?? "",
  );

  // Column visibility state with localStorage persistence
  const getInitialVisibility = (): VisibilityState => {
    if (columnVisibility?.storageKey) {
      try {
        const stored = localStorage.getItem(columnVisibility.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn("Failed to load column visibility from localStorage:", error);
      }
    }
    return columnVisibility?.initialState ?? {};
  };

  const [columnVisibilityState, setColumnVisibilityState] =
    useState<VisibilityState>(getInitialVisibility);

  // Save column visibility to localStorage
  useEffect(() => {
    if (columnVisibility?.storageKey) {
      try {
        localStorage.setItem(
          columnVisibility.storageKey,
          JSON.stringify(columnVisibilityState),
        );
      } catch (error) {
        console.warn("Failed to save column visibility to localStorage:", error);
      }
    }
  }, [columnVisibilityState, columnVisibility?.storageKey]);

  // Row selection state
  const [rowSelectionState, setRowSelectionState] = useState<RowSelectionState>(
    {},
  );

  // Expanded rows state
  const [expandedState, setExpandedState] = useState<ExpandedState>({});

  // ==================== Controlled State Handlers ====================

  // Handle pagination changes
  useEffect(() => {
    if (pagination?.onPaginationChange) {
      pagination.onPaginationChange(paginationState);
    }
  }, [paginationState, pagination]);

  // Handle sorting changes
  useEffect(() => {
    if (sorting?.onSortingChange) {
      sorting.onSortingChange(sortingState);
    }
  }, [sortingState, sorting]);

  // Handle column filter changes
  useEffect(() => {
    if (filtering?.onColumnFiltersChange) {
      filtering.onColumnFiltersChange(columnFiltersState);
    }
  }, [columnFiltersState, filtering]);

  // Handle global filter changes
  useEffect(() => {
    if (filtering?.onGlobalFilterChange) {
      filtering.onGlobalFilterChange(globalFilterState);
    }
  }, [globalFilterState, filtering]);

  // ==================== Table Configuration ====================

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    
    // Pagination
    ...(pagination && {
      getPaginationRowModel:
        pagination.mode === "client" ? getPaginationRowModel() : undefined,
      manualPagination: pagination.mode === "server",
      pageCount: pagination.pageCount,
    }),
    
    // Sorting
    ...(sorting && {
      getSortedRowModel:
        sorting.mode === "client" ? getSortedRowModel() : undefined,
      manualSorting: sorting.mode === "server",
    }),
    
    // Filtering
    ...(filtering && {
      getFilteredRowModel:
        filtering.mode === "client" ? getFilteredRowModel() : undefined,
      manualFiltering: filtering.mode === "server",
    }),

    // Expandable rows
    ...(expandable?.enabled && {
      getExpandedRowModel: getExpandedRowModel(),
      getRowCanExpand: expandable.getRowCanExpand,
    }),

    // Column resizing
    enableColumnResizing,
    columnResizeMode: "onChange",

    // Row ID
    getRowId,

    // State
    state: {
      pagination: paginationState,
      sorting: sortingState,
      columnFilters: columnFiltersState,
      globalFilter: globalFilterState,
      columnVisibility: columnVisibilityState,
      rowSelection: rowSelectionState,
      expanded: expandedState,
    },

    // State updaters
    onPaginationChange: setPaginationState,
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFiltersState,
    onGlobalFilterChange: setGlobalFilterState,
    onColumnVisibilityChange: setColumnVisibilityState,
    onRowSelectionChange: setRowSelectionState,
    onExpandedChange: setExpandedState,

    // Enable features
    enableRowSelection: selection?.enabled ?? false,
    enableMultiRowSelection: selection?.mode === "multiple",
  });

  // ==================== Selected Rows ====================

  const selectedRows = useMemo(() => {
    if (!selection?.enabled) return [];
    
    return table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original);
  }, [table, selection?.enabled, rowSelectionState]);

  const selectedCount = selectedRows.length;

  // Notify parent of selection changes
  useEffect(() => {
    if (selection?.onSelectionChange) {
      selection.onSelectionChange(selectedRows);
    }
  }, [selectedRows, selection]);

  // ==================== Return ====================

  return {
    table,
    selectedRows,
    selectedCount,
  };
}
