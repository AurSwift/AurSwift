import type { ComponentType } from "react";

export type CommandCenterPeriod = "today" | "week" | "month";

export interface PeriodOption {
  id: CommandCenterPeriod;
  label: string;
  description: string;
}

export interface CommandCenterDateRange {
  start: Date;
  end: Date;
  comparisonStart: Date;
  comparisonEnd: Date;
}

export type TrendDirection = "up" | "down" | "flat";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  deltaLabel: string;
  deltaDirection: TrendDirection;
  subtitle: string;
  iconName: "revenue" | "transactions" | "avg-ticket" | "labor";
}

export interface SalesTrendPoint {
  label: string;
  today: number;
  yesterday: number;
}

export type LiveActivitySeverity = "critical" | "warning" | "success" | "info";

export interface LiveActivityItem {
  id: string;
  severity: LiveActivitySeverity;
  message: string;
  sourceLabel: string;
  timestamp: string;
}

export interface TopSellerItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  changePercent: number;
}

export interface HourlyVolumePoint {
  label: string;
  volume: number;
}

export interface CategoryMixItem {
  id: string;
  label: string;
  value: number;
  percentage: number;
}

export interface QuickActionItem {
  id: string;
  label: string;
  shortcut: string;
  icon: ComponentType<{ className?: string }>;
  isPrimary?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onTrigger: () => void;
}

export interface CommandCenterViewModel {
  period: CommandCenterPeriod;
  periodOptions: PeriodOption[];
  dateLabel: string;
  isLoading: boolean;
  isDegraded: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: string | null;
  metrics: KpiMetric[];
  salesTrend: SalesTrendPoint[];
  liveActivity: LiveActivityItem[];
  topSellers: TopSellerItem[];
  hourlyVolume: HourlyVolumePoint[];
  categoryMix: CategoryMixItem[];
  quickActions: QuickActionItem[];
  onPeriodChange: (period: CommandCenterPeriod) => void;
  onRefresh: () => Promise<void>;
}

export interface DashboardStatisticsSnapshot {
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  salesToday: number;
  averageOrderValue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}

export interface InventoryStatsSnapshot {
  lowStockCount: number;
}

export interface TimeTrackingRealtimeSnapshot {
  currentlyWorking?: number;
  activeBreaks?: number;
  completedShifts?: number;
  timestamp?: string;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  categoryId?: string | null;
}

export interface CategoryCatalogItem {
  id: string;
  name: string;
}

export interface PayrollSummaryRow {
  totalPay?: number;
}
