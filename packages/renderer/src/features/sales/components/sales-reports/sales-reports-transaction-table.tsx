/**
 * Sales Reports Transaction Table
 *
 * Table with toolbar (Filters, Sort, Export, View), checkbox selection,
 * and detail via onViewTransaction. Matches Role Management table pattern.
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Filter, SlidersHorizontal, Download, View, MoreHorizontal } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { Transaction } from "./sales-reports-transaction-list";
import { TransactionRow } from "./transaction-row";
import type { TimePeriod, DateRange } from "./sales-reports-filters";

export type SortField =
  | "timestamp"
  | "receiptNumber"
  | "total"
  | "type"
  | "paymentMethod";
export type SortDirection = "asc" | "desc";

export interface FilterSummary {
  transactionType: string;
  paymentMethod: string;
  timePeriod: TimePeriod;
  dateRange: DateRange;
}

export interface SalesReportsTransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  emptyStateMessage?: string;
  className?: string;
  /** When set, pagination is controlled by parent (e.g. in MiniBar). */
  pagination?: {
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  onExport?: (format: "csv" | "pdf") => void;
  onViewTransaction?: (transaction: Transaction) => void;
  filterSummary?: FilterSummary;
  onResetFilters?: () => void;
}

function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case "today": return "Today";
    case "week": return "This week";
    case "month": return "This month";
    case "lastWeek": return "Last week";
    case "lastMonth": return "Last month";
    case "custom": return "Custom";
    default: return "";
  }
}

export function SalesReportsTransactionTable({
  transactions,
  isLoading = false,
  emptyStateMessage = "No transactions found",
  className,
  pagination: controlledPagination,
  onExport,
  onViewTransaction,
  filterSummary,
  onResetFilters,
}: SalesReportsTransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showItemsColumn, setShowItemsColumn] = useState(true);

  const pageSize = controlledPagination?.pageSize ?? 25;
  const currentPage = controlledPagination?.currentPage ?? 1;

  const hasActiveFilters =
    filterSummary &&
    (filterSummary.transactionType !== "all" ||
      filterSummary.paymentMethod !== "all" ||
      filterSummary.timePeriod !== "month");
  const activeFilterCount =
    filterSummary &&
    [
      filterSummary.transactionType !== "all",
      filterSummary.paymentMethod !== "all",
      filterSummary.timePeriod !== "month",
    ].filter(Boolean).length;

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case "timestamp":
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        case "receiptNumber":
          aVal = a.receiptNumber;
          bVal = b.receiptNumber;
          break;
        case "total":
          aVal = a.total;
          bVal = b.total;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "paymentMethod":
          aVal = a.paymentMethod;
          bVal = b.paymentMethod;
          break;
        default:
          return 0;
      }
      const dir = sortDirection === "asc" ? 1 : -1;
      if (aVal < bVal) return -dir;
      if (aVal > bVal) return dir;
      return 0;
    });
    return sorted;
  }, [transactions, sortField, sortDirection]);

  const totalItems = sortedTransactions.length;
  const pageTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(transactions.map((t) => t.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (ids.has(id)) next.add(id);
      });
      return next;
    });
  }, [transactions]);

  const visibleIds = pageTransactions.map((t) => t.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected =
    pageTransactions.length > 0 && selectedVisibleCount === pageTransactions.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  const setSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "timestamp" ? "desc" : "asc");
    }
  }, [sortField]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col flex-1 min-h-0",
          className,
        )}
      >
        <div className="flex items-center justify-center flex-1 min-h-[200px]">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Loading transactions...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-background shadow-sm overflow-hidden flex flex-col flex-1 min-h-0",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 py-2 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount != null && activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Active filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filterSummary && (
                <>
                  <DropdownMenuItem disabled>
                    Period: {getTimePeriodLabel(filterSummary.timePeriod)}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Type: {filterSummary.transactionType}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Payment: {filterSummary.paymentMethod}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!hasActiveFilters || !onResetFilters}
                onSelect={() => onResetFilters?.()}
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setSort("timestamp")}>
                Date {sortField === "timestamp" ? `(${sortDirection})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort("receiptNumber")}>
                Receipt # {sortField === "receiptNumber" ? `(${sortDirection})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort("total")}>
                Amount {sortField === "total" ? `(${sortDirection})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort("type")}>
                Type {sortField === "type" ? `(${sortDirection})` : ""}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSort("paymentMethod")}>
                Payment {sortField === "paymentMethod" ? `(${sortDirection})` : ""}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedIds.size > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8" disabled={transactions.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onExport("pdf")}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <View className="h-4 w-4 mr-2" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowItemsColumn((v) => !v)}>
                {showItemsColumn ? "Hide" : "Show"} items column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-1 min-h-0 flex flex-col">
        {transactions.length === 0 ? (
          <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingCart className="h-8 w-8 mx-auto opacity-50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">{emptyStateMessage}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Transactions will appear here once processed
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <Table className="min-w-[760px]">
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-background">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={
                          allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false
                        }
                        onCheckedChange={toggleSelectAllVisible}
                        aria-label="Select all visible rows"
                      />
                    </TableHead>
                    <TableHead
                      className={cn(
                        "text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none",
                      )}
                      onClick={() => setSort("type")}
                    >
                      Type
                    </TableHead>
                    <TableHead
                      className={cn(
                        "text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none",
                      )}
                      onClick={() => setSort("receiptNumber")}
                    >
                      Receipt #
                    </TableHead>
                    <TableHead
                      className={cn(
                        "text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none",
                      )}
                      onClick={() => setSort("timestamp")}
                    >
                      Date & Time
                    </TableHead>
                    {showItemsColumn && (
                      <TableHead className="hidden sm:table-cell text-xs uppercase tracking-wide text-muted-foreground">
                        Items
                      </TableHead>
                    )}
                    <TableHead
                      className={cn(
                        "text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none",
                      )}
                      onClick={() => setSort("paymentMethod")}
                    >
                      Payment
                    </TableHead>
                    <TableHead
                      className={cn(
                        "text-right text-xs uppercase tracking-wide text-muted-foreground cursor-pointer select-none",
                      )}
                      onClick={() => setSort("total")}
                    >
                      Amount
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase tracking-wide text-muted-foreground w-12">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageTransactions.map((transaction) => {
                    const isSelected = selectedIds.has(transaction.id);
                    return (
                      <React.Fragment key={transaction.id}>
                        <TableRow
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            isSelected && "bg-muted/30",
                          )}
                          onClick={() => onViewTransaction?.(transaction)}
                        >
                          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelected(transaction.id)}
                              aria-label={`Select ${transaction.receiptNumber}`}
                            />
                          </TableCell>
                          <TransactionRow
                            transaction={transaction}
                            isExpanded={false}
                            onToggleExpand={() => onViewTransaction?.(transaction)}
                            showItemsColumn={showItemsColumn}
                            cellsOnly
                          />
                          <TableCell
                            className="text-right w-12"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => onViewTransaction?.(transaction)}
                                >
                                  <View className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Footer: selection count */}
            <div className="border-t bg-background shrink-0">
              <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground flex items-center justify-between gap-3">
                <span>
                  {selectedIds.size} of {totalItems} row(s) selected
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
