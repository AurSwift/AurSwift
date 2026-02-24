import type { Transaction } from "@/features/sales/components/sales-reports";
import type {
  CategoryCatalogItem,
  CategoryMixItem,
  CommandCenterDateRange,
  CommandCenterPeriod,
  DashboardStatisticsSnapshot,
  HourlyVolumePoint,
  InventoryStatsSnapshot,
  KpiMetric,
  LiveActivityItem,
  PayrollSummaryRow,
  ProductCatalogItem,
  SalesTrendPoint,
  TimeTrackingRealtimeSnapshot,
  TopSellerItem,
  TrendDirection,
} from "../types/command-center.types";

interface BuildKpiMetricsArgs {
  statistics: DashboardStatisticsSnapshot | null;
  transactions: Transaction[];
  periodRange: CommandCenterDateRange;
  laborCostPercent: number;
  previousLaborCostPercent: number;
}

interface BuildLiveActivityArgs {
  transactions: Transaction[];
  inventoryStats: InventoryStatsSnapshot | null;
  realtime: TimeTrackingRealtimeSnapshot | null;
  businessName?: string | null;
  now?: Date;
}

interface BuildTopSellersArgs {
  transactions: Transaction[];
  periodRange: CommandCenterDateRange;
  limit?: number;
}

interface BuildCategoryMixArgs {
  transactions: Transaction[];
  products: ProductCatalogItem[];
  categories: CategoryCatalogItem[];
  periodRange: CommandCenterDateRange;
  limit?: number;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatHourLabel(hour: number): string {
  const meridiem = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}${meridiem}`;
}

function hasValidTransactionTime(transaction: Transaction): number | null {
  const timestamp = new Date(transaction.timestamp).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isCompletedSale(transaction: Transaction): boolean {
  return transaction.type === "sale" && transaction.status === "completed";
}

function transactionInRange(
  transaction: Transaction,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const timestamp = hasValidTransactionTime(transaction);
  if (timestamp === null) return false;
  return timestamp >= rangeStart.getTime() && timestamp <= rangeEnd.getTime();
}

function sumRevenueInRange(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return transactions.reduce((sum, transaction) => {
    if (!isCompletedSale(transaction)) return sum;
    if (!transactionInRange(transaction, rangeStart, rangeEnd)) return sum;
    return sum + Math.abs(toNumber(transaction.total));
  }, 0);
}

function countSalesInRange(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return transactions.reduce((count, transaction) => {
    if (!isCompletedSale(transaction)) return count;
    if (!transactionInRange(transaction, rangeStart, rangeEnd)) return count;
    return count + 1;
  }, 0);
}

function averageTicketFromRevenue(revenue: number, transactions: number): number {
  if (transactions <= 0) return 0;
  return revenue / transactions;
}

function percentageDelta(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

function directionFromDelta(delta: number): TrendDirection {
  if (delta > 0.01) return "up";
  if (delta < -0.01) return "down";
  return "flat";
}

function formatSignedPercent(value: number): string {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  if (rounded === 0) return "0.0%";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1)}%`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(toNumber(value));
}

export function formatPercent(value: number): string {
  return `${toNumber(value).toFixed(1)}%`;
}

export function formatRelativeTime(timestamp: string, now = new Date()): string {
  const timeMs = new Date(timestamp).getTime();
  if (!Number.isFinite(timeMs)) return "just now";

  const deltaMs = Math.max(0, now.getTime() - timeMs);
  const minutes = Math.floor(deltaMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getCommandCenterDateRange(
  period: CommandCenterPeriod,
  now = new Date(),
): CommandCenterDateRange {
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case "week":
      start = startOfDay(addDays(end, -6));
      break;
    case "month":
      start = startOfDay(addDays(end, -29));
      break;
    default:
      start = startOfDay(end);
      break;
  }

  const windowMs = Math.max(1, end.getTime() - start.getTime() + 1);
  const comparisonEnd = new Date(start.getTime() - 1);
  const comparisonStart = new Date(comparisonEnd.getTime() - windowMs + 1);

  return {
    start,
    end,
    comparisonStart,
    comparisonEnd,
  };
}

export function buildKpiMetrics({
  statistics,
  transactions,
  periodRange,
  laborCostPercent,
  previousLaborCostPercent,
}: BuildKpiMetricsArgs): KpiMetric[] {
  const currentRevenue = sumRevenueInRange(
    transactions,
    periodRange.start,
    periodRange.end,
  );
  const previousRevenue = sumRevenueInRange(
    transactions,
    periodRange.comparisonStart,
    periodRange.comparisonEnd,
  );

  const currentSales = countSalesInRange(
    transactions,
    periodRange.start,
    periodRange.end,
  );
  const previousSales = countSalesInRange(
    transactions,
    periodRange.comparisonStart,
    periodRange.comparisonEnd,
  );

  const currentAvgTicket = averageTicketFromRevenue(currentRevenue, currentSales);
  const previousAvgTicket = averageTicketFromRevenue(previousRevenue, previousSales);

  const resolvedRevenue =
    currentRevenue > 0
      ? currentRevenue
      : toNumber(statistics?.revenue.current);
  const resolvedRevenueDelta =
    currentRevenue > 0 || previousRevenue > 0
      ? percentageDelta(currentRevenue, previousRevenue)
      : toNumber(statistics?.revenue.changePercent);

  const resolvedSales =
    currentSales > 0 ? currentSales : toNumber(statistics?.salesToday);
  const resolvedSalesDelta =
    currentSales > 0 || previousSales > 0
      ? percentageDelta(currentSales, previousSales)
      : 0;

  const resolvedAvgTicket =
    currentAvgTicket > 0
      ? currentAvgTicket
      : toNumber(statistics?.averageOrderValue.current);
  const resolvedAvgTicketDelta =
    currentAvgTicket > 0 || previousAvgTicket > 0
      ? percentageDelta(currentAvgTicket, previousAvgTicket)
      : toNumber(statistics?.averageOrderValue.changePercent);

  const laborDelta = percentageDelta(laborCostPercent, previousLaborCostPercent);

  return [
    {
      id: "revenue",
      label: "Total Revenue",
      value: formatCurrency(resolvedRevenue),
      deltaLabel: formatSignedPercent(resolvedRevenueDelta),
      deltaDirection: directionFromDelta(resolvedRevenueDelta),
      subtitle: "vs previous period",
      iconName: "revenue",
    },
    {
      id: "transactions",
      label: "Transactions",
      value: Math.round(resolvedSales).toLocaleString("en-GB"),
      deltaLabel: formatSignedPercent(resolvedSalesDelta),
      deltaDirection: directionFromDelta(resolvedSalesDelta),
      subtitle: "completed sales",
      iconName: "transactions",
    },
    {
      id: "avg-ticket",
      label: "Avg. Ticket",
      value: formatCurrency(resolvedAvgTicket),
      deltaLabel: formatSignedPercent(resolvedAvgTicketDelta),
      deltaDirection: directionFromDelta(resolvedAvgTicketDelta),
      subtitle: "basket average",
      iconName: "avg-ticket",
    },
    {
      id: "labor",
      label: "Labor Cost %",
      value: formatPercent(laborCostPercent),
      deltaLabel: formatSignedPercent(laborDelta),
      deltaDirection: directionFromDelta(-laborDelta),
      subtitle: "labor vs revenue",
      iconName: "labor",
    },
  ];
}

function sumSalesBetween(
  transactions: Transaction[],
  start: Date,
  end: Date,
): number {
  return transactions.reduce((sum, transaction) => {
    if (!isCompletedSale(transaction)) return sum;
    if (!transactionInRange(transaction, start, end)) return sum;
    return sum + Math.abs(toNumber(transaction.total));
  }, 0);
}

export function buildSalesTrend(
  transactions: Transaction[],
  period: CommandCenterPeriod,
  now = new Date(),
): SalesTrendPoint[] {
  if (period === "today") {
    const todayStart = startOfDay(now);
    const yesterdayStart = addDays(todayStart, -1);
    const bucketHours = [6, 8, 10, 12, 14, 16, 18, 20, 22];

    return bucketHours.map((hour, index) => {
      const nextHour = bucketHours[index + 1] ?? 24;

      const todayBucketStart = new Date(todayStart);
      todayBucketStart.setHours(hour, 0, 0, 0);
      const todayBucketEnd = new Date(todayStart);
      todayBucketEnd.setHours(nextHour, 0, 0, 0);
      todayBucketEnd.setMilliseconds(todayBucketEnd.getMilliseconds() - 1);

      const yesterdayBucketStart = new Date(yesterdayStart);
      yesterdayBucketStart.setHours(hour, 0, 0, 0);
      const yesterdayBucketEnd = new Date(yesterdayStart);
      yesterdayBucketEnd.setHours(nextHour, 0, 0, 0);
      yesterdayBucketEnd.setMilliseconds(yesterdayBucketEnd.getMilliseconds() - 1);

      return {
        label: formatHourLabel(hour),
        today: sumSalesBetween(transactions, todayBucketStart, todayBucketEnd),
        yesterday: sumSalesBetween(
          transactions,
          yesterdayBucketStart,
          yesterdayBucketEnd,
        ),
      };
    });
  }

  const range = getCommandCenterDateRange(period, now);
  const windowDays =
    period === "week" ? 7 : Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1);
  const bucketSizeDays = period === "month" ? 3 : 1;
  const bucketCount = Math.ceil(windowDays / bucketSizeDays);

  return Array.from({ length: bucketCount }, (_, index) => {
    const currentStart = startOfDay(addDays(range.start, index * bucketSizeDays));
    const currentEnd = endOfDay(
      addDays(currentStart, Math.min(bucketSizeDays - 1, windowDays - 1)),
    );
    const boundedCurrentEnd = currentEnd.getTime() > range.end.getTime() ? range.end : currentEnd;

    const comparisonStart = startOfDay(
      addDays(range.comparisonStart, index * bucketSizeDays),
    );
    const comparisonEnd = endOfDay(
      addDays(comparisonStart, Math.min(bucketSizeDays - 1, windowDays - 1)),
    );
    const boundedComparisonEnd =
      comparisonEnd.getTime() > range.comparisonEnd.getTime()
        ? range.comparisonEnd
        : comparisonEnd;

    return {
      label:
        period === "week"
          ? currentStart.toLocaleDateString("en-US", { weekday: "short" })
          : formatDateLabel(currentStart),
      today: sumSalesBetween(transactions, currentStart, boundedCurrentEnd),
      yesterday: sumSalesBetween(
        transactions,
        comparisonStart,
        boundedComparisonEnd,
      ),
    };
  });
}

export function buildHourlyVolume(
  transactions: Transaction[],
  now = new Date(),
): HourlyVolumePoint[] {
  const dayStart = startOfDay(now);
  const hours = Array.from({ length: 12 }, (_, index) => 6 + index);

  return hours.map((hour) => {
    const start = new Date(dayStart);
    start.setHours(hour, 0, 0, 0);

    const end = new Date(dayStart);
    end.setHours(hour + 1, 0, 0, 0);
    end.setMilliseconds(end.getMilliseconds() - 1);

    const volume = countSalesInRange(transactions, start, end);

    return {
      label: formatHourLabel(hour),
      volume,
    };
  });
}

export function buildTopSellers({
  transactions,
  periodRange,
  limit = 5,
}: BuildTopSellersArgs): TopSellerItem[] {
  const currentAggregate = new Map<
    string,
    { id: string; name: string; quantity: number; revenue: number }
  >();
  const previousAggregate = new Map<string, { quantity: number }>();

  const aggregateRange = (
    target: Map<string, { id?: string; name?: string; quantity: number; revenue?: number }>,
    start: Date,
    end: Date,
  ) => {
    for (const transaction of transactions) {
      if (!isCompletedSale(transaction)) continue;
      if (!transactionInRange(transaction, start, end)) continue;

      for (const item of transaction.items || []) {
        const itemId = item.productId || item.productName;
        if (!itemId) continue;

        const quantity = Math.max(0, toNumber(item.quantity));
        const revenue =
          toNumber(item.totalPrice) > 0
            ? toNumber(item.totalPrice)
            : quantity * Math.max(0, toNumber(item.unitPrice));

        const existing = target.get(itemId) || {
          id: itemId,
          name: item.productName || "Unknown Item",
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += quantity;
        if (typeof existing.revenue === "number") {
          existing.revenue += revenue;
        }
        if (!existing.name && item.productName) {
          existing.name = item.productName;
        }
        if (!existing.id) {
          existing.id = itemId;
        }

        target.set(itemId, existing);
      }
    }
  };

  aggregateRange(currentAggregate, periodRange.start, periodRange.end);
  aggregateRange(
    previousAggregate,
    periodRange.comparisonStart,
    periodRange.comparisonEnd,
  );

  return [...currentAggregate.values()]
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, limit)
    .map((seller) => {
      const previous = previousAggregate.get(seller.id)?.quantity ?? 0;
      return {
        id: seller.id,
        name: seller.name,
        quantity: seller.quantity,
        revenue: seller.revenue,
        changePercent: percentageDelta(seller.quantity, previous),
      };
    });
}

export function buildCategoryMix({
  transactions,
  products,
  categories,
  periodRange,
  limit = 5,
}: BuildCategoryMixArgs): CategoryMixItem[] {
  const productToCategory = new Map<string, string>();
  for (const product of products) {
    if (!product?.id) continue;
    productToCategory.set(product.id, product.categoryId || "uncategorized");
  }

  const categoryNameById = new Map<string, string>();
  for (const category of categories) {
    if (!category?.id) continue;
    categoryNameById.set(category.id, category.name || "Uncategorized");
  }

  const categoryRevenue = new Map<string, number>();

  for (const transaction of transactions) {
    if (!isCompletedSale(transaction)) continue;
    if (!transactionInRange(transaction, periodRange.start, periodRange.end)) {
      continue;
    }

    for (const item of transaction.items || []) {
      const quantity = Math.max(0, toNumber(item.quantity));
      const itemRevenue =
        toNumber(item.totalPrice) > 0
          ? toNumber(item.totalPrice)
          : quantity * Math.max(0, toNumber(item.unitPrice));

      const categoryId =
        (item.productId && productToCategory.get(item.productId)) ||
        "uncategorized";
      const categoryLabel =
        categoryNameById.get(categoryId) ||
        (categoryId === "uncategorized" ? "Uncategorized" : categoryId);

      categoryRevenue.set(
        categoryLabel,
        (categoryRevenue.get(categoryLabel) || 0) + itemRevenue,
      );
    }
  }

  const totalRevenue = [...categoryRevenue.values()].reduce(
    (sum, value) => sum + value,
    0,
  );

  if (totalRevenue <= 0) {
    return [];
  }

  const sorted = [...categoryRevenue.entries()]
    .map(([label, value]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      value,
    }))
    .sort((left, right) => right.value - left.value);

  const limited = sorted.slice(0, limit);
  const remaining = sorted.slice(limit);

  if (remaining.length > 0) {
    const remainingTotal = remaining.reduce((sum, item) => sum + item.value, 0);
    limited.push({
      id: "other",
      label: "Other",
      value: remainingTotal,
    });
  }

  return limited.map((item) => ({
    ...item,
    percentage: totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0,
  }));
}

function severityFromTransaction(
  transaction: Transaction,
): LiveActivityItem["severity"] {
  if (transaction.status !== "completed") return "critical";
  if (transaction.type === "refund" || transaction.type === "void") return "warning";
  return "success";
}

function messageFromTransaction(transaction: Transaction): string {
  const amount = formatCurrency(Math.abs(toNumber(transaction.total)));

  if (transaction.type === "sale") {
    return `Sale completed: ${amount}`;
  }

  if (transaction.type === "refund") {
    return `Refund issued: ${amount}`;
  }

  return `Transaction voided: ${amount}`;
}

export function buildLiveActivityItems({
  transactions,
  inventoryStats,
  realtime,
  businessName,
  now = new Date(),
}: BuildLiveActivityArgs): LiveActivityItem[] {
  const items: LiveActivityItem[] = [];
  const sourceLabel = businessName || "Main terminal";

  const sortedTransactions = [...transactions]
    .filter((transaction) => hasValidTransactionTime(transaction) !== null)
    .sort((left, right) => {
      const leftTime = new Date(left.timestamp).getTime();
      const rightTime = new Date(right.timestamp).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 4);

  for (const transaction of sortedTransactions) {
    items.push({
      id: `txn-${transaction.id}`,
      severity: severityFromTransaction(transaction),
      message: messageFromTransaction(transaction),
      sourceLabel,
      timestamp: transaction.timestamp,
    });
  }

  if ((inventoryStats?.lowStockCount || 0) > 0) {
    items.push({
      id: "inventory-low-stock",
      severity: "critical",
      message: `Low stock detected on ${inventoryStats?.lowStockCount || 0} item(s)`,
      sourceLabel,
      timestamp: new Date(now.getTime() - 120_000).toISOString(),
    });
  }

  if ((realtime?.currentlyWorking || 0) > 0) {
    items.push({
      id: "realtime-working",
      severity: "success",
      message: `${realtime?.currentlyWorking || 0} team member(s) clocked in`,
      sourceLabel,
      timestamp: realtime?.timestamp || new Date(now.getTime() - 180_000).toISOString(),
    });
  }

  if ((realtime?.activeBreaks || 0) > 0) {
    items.push({
      id: "realtime-breaks",
      severity: "warning",
      message: `${realtime?.activeBreaks || 0} team member(s) currently on break`,
      sourceLabel,
      timestamp: realtime?.timestamp || new Date(now.getTime() - 240_000).toISOString(),
    });
  }

  return items
    .sort((left, right) => {
      const leftMs = new Date(left.timestamp).getTime();
      const rightMs = new Date(right.timestamp).getTime();
      return rightMs - leftMs;
    })
    .slice(0, 6);
}

export function summarizePayrollCost(rows: PayrollSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + Math.max(0, toNumber(row.totalPay)), 0);
}
