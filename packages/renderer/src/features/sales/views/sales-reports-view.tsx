/**
 * Sales Reports View
 *
 * Comprehensive sales analytics and reports view.
 * Follows mini-bar + detail pattern: MiniBar, metrics, table with toolbar, transaction detail drawer.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import "./sales-reports-view.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getLogger } from "@/shared/utils/logger";
import { useSalesReportsData } from "../hooks/use-sales-reports-data";
import { MiniBar } from "@/components/mini-bar";
import {
  SalesReportsStatsCard,
  SalesReportsTransactionTable,
  SalesReportsFilters,
  SalesReportsPerformanceMetrics,
  TransactionDetailDrawer,
} from "../components/sales-reports";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useNavigation } from "@/navigation/hooks/use-navigation";
import type {
  TransactionTypeFilter,
  PaymentMethodFilter,
  TimePeriod,
  DateRange,
} from "../components/sales-reports";
import type { Transaction } from "../components/sales-reports";
import { useUserPermissions } from "@/features/dashboard/hooks/use-user-permissions";
import { PERMISSIONS } from "@app/shared/constants/permissions";
import { useExportReports } from "../hooks/use-export-reports";
import { toast } from "sonner";

const logger = getLogger("sales-reports-view");

interface SalesReportsViewProps {
  onBack?: () => void;
  embeddedInDashboard?: boolean;
}

const SalesReportsView = ({ onBack }: SalesReportsViewProps) => {
  const { hasPermission } = useUserPermissions();
  const { goToRoot } = useNavigation();
  const { exportToCSV, exportToPDF } = useExportReports();

  // Filter state (for data fetch)
  const [transactionType, setTransactionType] =
    useState<TransactionTypeFilter>("all");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodFilter>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // View state: search and pagination (lifted for MiniBar)
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Calculate date range based on time period
  const calculatedDateRange = useMemo((): DateRange => {
    if (timePeriod === "custom" && dateRange) {
      return dateRange;
    }

    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (timePeriod) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastWeek": {
        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);
        end.setTime(lastWeekEnd.getTime());
        start.setDate(lastWeekEnd.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      }
      case "lastMonth":
        start.setMonth(now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "custom":
        if (!dateRange) {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setMonth(now.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return dateRange;
    }

    return { start, end };
  }, [timePeriod, dateRange]);

  const {
    transactions,
    totalSales,
    totalRefunds,
    totalVoids,
    performanceMetrics,
    isLoading,
    isLoadingTransactions,
    error,
    refetch,
  } = useSalesReportsData({
    transactionType,
    paymentMethod,
    timePeriod,
    dateRange: calculatedDateRange,
    limit: 50,
  });

  // Client-side search filter for table
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const q = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.receiptNumber.toLowerCase().includes(q) ||
        t.timestamp.toLowerCase().includes(q) ||
        t.items.some((item) => item.productName.toLowerCase().includes(q)),
    );
  }, [transactions, searchTerm]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const filteredStats = useMemo(() => {
    const sales = transactions.filter((t) => t.type === "sale");
    const filteredAOV = sales.length > 0 ? totalSales / sales.length : 0;
    return {
      revenue: totalSales,
      salesCount: sales.length,
      refundsCount: transactions.filter((t) => t.type === "refund").length,
      averageOrderValue: filteredAOV,
    };
  }, [transactions, totalSales]);

  const getTimePeriodLabel = useCallback((): string => {
    switch (timePeriod) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "lastWeek":
        return "Last Week";
      case "lastMonth":
        return "Last Month";
      case "custom":
        if (calculatedDateRange) {
          return `${calculatedDateRange.start.toLocaleDateString()} - ${calculatedDateRange.end.toLocaleDateString()}`;
        }
        return "Custom Range";
      default:
        return "";
    }
  }, [timePeriod, calculatedDateRange]);

  const adjustmentsValue = useMemo(() => totalRefunds, [totalRefunds]);

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      try {
        logger.info(`Exporting sales report as ${format}`);
        if (!calculatedDateRange) {
          toast.error("Cannot export report: date range is not defined");
          return;
        }
        if (transactions.length === 0) {
          toast.warning("No transactions to export");
          return;
        }
        const statistics = {
          totalSales,
          totalRefunds,
          totalVoids,
          revenue: filteredStats.revenue,
          averageOrderValue: filteredStats.averageOrderValue,
          transactionCount: filteredStats.salesCount,
        };
        if (format === "csv") {
          await exportToCSV(transactions, calculatedDateRange, statistics);
        } else if (format === "pdf") {
          await exportToPDF(transactions, calculatedDateRange, statistics);
        }
      } catch (err) {
        logger.error("Export failed:", err);
      }
    },
    [
      calculatedDateRange,
      transactions,
      totalSales,
      totalRefunds,
      totalVoids,
      filteredStats,
      exportToCSV,
      exportToPDF,
    ],
  );

  const handleResetFilters = useCallback(() => {
    setTransactionType("all");
    setPaymentMethod("all");
    setTimePeriod("month");
    setDateRange(undefined);
  }, []);

  const openDetailDrawer = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDrawerOpen(true);
  }, []);

  const canViewFinancials = hasPermission(PERMISSIONS.REPORTS_READ);
  const canExport = hasPermission(PERMISSIONS.REPORTS_READ);

  if (!canViewFinancials) {
    return (
      <div className="container mx-auto p-1 max-w-[1600px] flex flex-col flex-1 min-h-0">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You don't have permission to view sales reports.
            </p>
            {onBack && (
              <Button variant="outline" size="sm" onClick={onBack} className="mt-4">
                Go Back
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-1 max-w-[1600px] flex flex-col flex-1 min-h-0">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600 mb-4">Error loading sales reports</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="sales-reports-view container mx-auto p-1 max-w-[1600px] flex flex-col flex-1 min-h-0 gap-4 sm:gap-6">
      <MiniBar
        className="shrink-0"
        title="Sales Reports"
        onBack={onBack || goToRoot}
        backAriaLabel="Back to Dashboard"
        center={
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt or description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-8"
              />
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {totalItems === 0
                ? "0 / 0"
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalItems)} / ${totalItems}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || totalPages <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages <= 1}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Filters (compact: used by table toolbar; keep for date/period/type/method) */}
      <div className="no-print shrink-0">
        <SalesReportsFilters
          transactionType={transactionType}
          paymentMethod={paymentMethod}
          timePeriod={timePeriod}
          dateRange={calculatedDateRange}
          onTransactionTypeChange={setTransactionType}
          onPaymentMethodChange={setPaymentMethod}
          onTimePeriodChange={setTimePeriod}
          onDateRangeChange={setDateRange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Metrics: 4 stats cards + performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0">
        <SalesReportsStatsCard
          title="Total Revenue"
          value={filteredStats.revenue}
          change={`${getTimePeriodLabel()} • £${filteredStats.revenue.toFixed(2)}`}
          icon={DollarSign}
          colorTheme="green"
          isLoading={isLoading}
          valueFormat="currency"
        />
        <SalesReportsStatsCard
          title="Sales"
          value={`${filteredStats.salesCount}`}
          change={`${getTimePeriodLabel()} • ${filteredStats.salesCount} transaction${filteredStats.salesCount !== 1 ? "s" : ""}`}
          icon={ShoppingCart}
          colorTheme="blue"
          isLoading={isLoading}
          valueFormat="count"
        />
        <SalesReportsStatsCard
          title="Average Order Value"
          value={filteredStats.averageOrderValue}
          change={`${getTimePeriodLabel()} • £${filteredStats.averageOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          colorTheme="purple"
          isLoading={isLoading}
          valueFormat="currency"
        />
        <SalesReportsStatsCard
          title="Adjustments"
          value={-adjustmentsValue}
          change={`${totalVoids} voided, £${totalRefunds.toFixed(2)} refunded`}
          icon={RefreshCw}
          colorTheme="red"
          isLoading={isLoading}
          valueFormat="currency"
          showNegative
        />
      </div>

      {performanceMetrics && (
        <div className="shrink-0">
          <SalesReportsPerformanceMetrics metrics={performanceMetrics} />
        </div>
      )}

      {/* Table block with toolbar and selection footer */}
      <div className="flex-1 min-h-0 flex flex-col">
        <SalesReportsTransactionTable
          transactions={filteredTransactions}
          isLoading={isLoadingTransactions}
          emptyStateMessage="No transactions found for the selected filters"
          pagination={{
            currentPage,
            pageSize,
            onPageChange: setCurrentPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setCurrentPage(1);
            },
          }}
          onExport={canExport ? handleExport : undefined}
          onViewTransaction={openDetailDrawer}
          filterSummary={{
            transactionType,
            paymentMethod,
            timePeriod,
            dateRange: calculatedDateRange,
          }}
          onResetFilters={handleResetFilters}
        />
      </div>

      <TransactionDetailDrawer
        transaction={selectedTransaction}
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) setSelectedTransaction(null);
        }}
      />
    </div>
  );
};

export default SalesReportsView;
