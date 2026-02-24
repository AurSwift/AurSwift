import { AlertTriangle } from "lucide-react";
import { useDashboardActionShortcuts } from "../hooks/use-dashboard-action-shortcuts";
import { useCommandCenterData } from "../hooks/use-command-center-data";
import { COMMAND_CENTER_THEME } from "../constants/command-center-theme";
import { CommandCenterHeader } from "./command-center-header";
import { KpiGrid } from "./kpi-grid";
import { QuickActionsBar } from "./quick-actions-bar";
import { SalesTrendPanel } from "./sales-trend-panel";
import { LiveActivityPanel } from "./live-activity-panel";
import { TopSellersPanel } from "./top-sellers-panel";
import { HourlyVolumePanel } from "./hourly-volume-panel";
import { CategoryMixPanel } from "./category-mix-panel";

export function CommandCenterDashboard() {
  const model = useCommandCenterData();

  useDashboardActionShortcuts(model.quickActions);

  return (
    <section className="min-h-full">
      <div
        className={`${COMMAND_CENTER_THEME.container} mx-auto w-full max-w-[1800px] space-y-2 px-2 py-2 pb-6 sm:space-y-3 sm:px-3 sm:pb-8 lg:px-4`}
        data-testid="command-center-dashboard"
      >
        <CommandCenterHeader
          dateLabel={model.dateLabel}
          period={model.period}
          periodOptions={model.periodOptions}
          isRefreshing={model.isRefreshing}
          isDegraded={model.isDegraded}
          lastUpdatedAt={model.lastUpdatedAt}
          onPeriodChange={model.onPeriodChange}
          onRefresh={model.onRefresh}
        />

        {model.isDegraded ? (
          <div className="flex items-start gap-2 bg-amber-50 px-2 py-1.5 text-caption text-amber-800 sm:text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The dashboard is running in degraded mode. Some panels are using fallback data.
            </span>
          </div>
        ) : null}

        <KpiGrid metrics={model.metrics} />
        <QuickActionsBar actions={model.quickActions} />

        <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SalesTrendPanel data={model.salesTrend} isLoading={model.isLoading} />
          <LiveActivityPanel items={model.liveActivity} isLoading={model.isLoading} />
        </div>

        <div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TopSellersPanel items={model.topSellers} isLoading={model.isLoading} />
          <HourlyVolumePanel data={model.hourlyVolume} isLoading={model.isLoading} />
          <CategoryMixPanel data={model.categoryMix} isLoading={model.isLoading} />
        </div>
      </div>
    </section>
  );
}
