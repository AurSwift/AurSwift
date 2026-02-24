import type {
  CategoryMixItem,
  CommandCenterPeriod,
  HourlyVolumePoint,
  KpiMetric,
  PeriodOption,
  SalesTrendPoint,
} from "../types/command-center.types";

export const DEFAULT_PERIOD: CommandCenterPeriod = "today";

export const COMMAND_CENTER_PERIOD_OPTIONS: PeriodOption[] = [
  {
    id: "today",
    label: "Today",
    description: "Current trading day",
  },
  {
    id: "week",
    label: "7D",
    description: "Last seven days",
  },
  {
    id: "month",
    label: "30D",
    description: "Last 30 days",
  },
];

export const CATEGORY_MIX_COLORS = [
  "#34d399",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
  "#22d3ee",
  "#94a3b8",
];

export const EMPTY_METRICS: KpiMetric[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: "GBP0.00",
    deltaLabel: "0.0%",
    deltaDirection: "flat",
    subtitle: "No sales yet",
    iconName: "revenue",
  },
  {
    id: "transactions",
    label: "Transactions",
    value: "0",
    deltaLabel: "0.0%",
    deltaDirection: "flat",
    subtitle: "No completed sales",
    iconName: "transactions",
  },
  {
    id: "avg-ticket",
    label: "Avg. Ticket",
    value: "GBP0.00",
    deltaLabel: "0.0%",
    deltaDirection: "flat",
    subtitle: "No basket data",
    iconName: "avg-ticket",
  },
  {
    id: "labor",
    label: "Labor Cost %",
    value: "0.0%",
    deltaLabel: "0.0%",
    deltaDirection: "flat",
    subtitle: "No labor data",
    iconName: "labor",
  },
];

export const EMPTY_SALES_TREND: SalesTrendPoint[] = [];

export const EMPTY_HOURLY_VOLUME: HourlyVolumePoint[] = [];

export const EMPTY_CATEGORY_MIX: CategoryMixItem[] = [];

export const SUPPLEMENTAL_REFRESH_INTERVAL_MS = 60_000;

export const TRANSACTION_HISTORY_LIMIT = 250;
