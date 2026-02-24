import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Plus } from "lucide-react";
import { render, screen } from "../../../utils/render-helpers";
import userEvent from "@testing-library/user-event";
import { CommandCenterDashboard } from "@/features/dashboard/command-center";
import type { CommandCenterViewModel } from "@/features/dashboard/command-center";

const mockUseCommandCenterData = vi.fn();
const mockUseDashboardActionShortcuts = vi.fn();

vi.mock("@/features/dashboard/command-center/hooks/use-command-center-data", () => ({
  useCommandCenterData: () => mockUseCommandCenterData(),
}));

vi.mock(
  "@/features/dashboard/command-center/hooks/use-dashboard-action-shortcuts",
  () => ({
    useDashboardActionShortcuts: (...args: unknown[]) =>
      mockUseDashboardActionShortcuts(...args),
  }),
);

vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 800, height: 320 }}>{children}</div>
    ),
  };
});

function createModel(overrides: Partial<CommandCenterViewModel> = {}): CommandCenterViewModel {
  const onPeriodChange = vi.fn();
  const onRefresh = vi.fn().mockResolvedValue(undefined);

  return {
    period: "today",
    periodOptions: [
      { id: "today", label: "Today", description: "Current trading day" },
      { id: "week", label: "7D", description: "Last seven days" },
      { id: "month", label: "30D", description: "Last 30 days" },
    ],
    dateLabel: "Monday, January 26, 2026",
    isLoading: false,
    isDegraded: false,
    isRefreshing: false,
    lastUpdatedAt: "2026-02-23T11:30:00.000Z",
    metrics: [
      {
        id: "revenue",
        label: "Total Revenue",
        value: "GBP24,847.00",
        deltaLabel: "+12.5%",
        deltaDirection: "up",
        subtitle: "vs yesterday",
        iconName: "revenue",
      },
      {
        id: "transactions",
        label: "Transactions",
        value: "1,247",
        deltaLabel: "+8.3%",
        deltaDirection: "up",
        subtitle: "vs yesterday",
        iconName: "transactions",
      },
      {
        id: "avg-ticket",
        label: "Avg. Ticket",
        value: "GBP19.92",
        deltaLabel: "-2.1%",
        deltaDirection: "down",
        subtitle: "vs yesterday",
        iconName: "avg-ticket",
      },
      {
        id: "labor",
        label: "Labor Cost %",
        value: "28.4%",
        deltaLabel: "-1.2%",
        deltaDirection: "up",
        subtitle: "vs target",
        iconName: "labor",
      },
    ],
    salesTrend: [
      { label: "6AM", today: 1000, yesterday: 900 },
      { label: "8AM", today: 2000, yesterday: 1800 },
    ],
    liveActivity: [
      {
        id: "live-1",
        severity: "critical",
        message: "Low stock: Chicken Breast",
        sourceLabel: "Downtown",
        timestamp: "2026-02-23T11:58:00.000Z",
      },
    ],
    topSellers: [
      {
        id: "item-1",
        name: "Classic Burger",
        quantity: 342,
        revenue: 4788,
        changePercent: 12,
      },
    ],
    hourlyVolume: [{ label: "6AM", volume: 45 }],
    categoryMix: [
      { id: "mains", label: "Mains", value: 42, percentage: 42 },
      { id: "drinks", label: "Drinks", value: 18, percentage: 18 },
    ],
    quickActions: [
      {
        id: "add-item",
        label: "Add Item",
        shortcut: "F2",
        icon: Plus,
        isPrimary: true,
        onTrigger: vi.fn(),
      },
      {
        id: "new-report",
        label: "New Report",
        shortcut: "F4",
        icon: Plus,
        disabled: true,
        disabledReason: "Reports permission required.",
        onTrigger: vi.fn(),
      },
    ],
    onPeriodChange,
    onRefresh,
    ...overrides,
  };
}

describe("CommandCenterDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders D1 KPI cards and quick actions", () => {
    mockUseCommandCenterData.mockReturnValue(createModel());

    render(<CommandCenterDashboard />);

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Avg. Ticket")).toBeInTheDocument();
    expect(screen.getByText("Labor Cost %")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new report/i })).toBeDisabled();
  });

  it("triggers refresh and period change handlers", async () => {
    const user = userEvent.setup();
    const model = createModel();
    mockUseCommandCenterData.mockReturnValue(model);

    render(<CommandCenterDashboard />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));
    expect(model.onRefresh).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: /last seven days/i }));
    expect(model.onPeriodChange).toHaveBeenCalledWith("week");
  });

  it("renders explicit empty states for D2 and D3 panels", () => {
    mockUseCommandCenterData.mockReturnValue(
      createModel({
        salesTrend: [],
        liveActivity: [],
        topSellers: [],
        hourlyVolume: [],
        categoryMix: [],
      }),
    );

    render(<CommandCenterDashboard />);

    expect(
      screen.getByText("No trend data available for the selected period."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No activity events are available yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No product sales data available."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hourly volume data available."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No category distribution data available."),
    ).toBeInTheDocument();
  });
});
