/**
 * Time & Break Reports Layout
 *
 * Two-column layout: MiniBar at top, left sidebar with section tabs
 * (Shifts, Compliance, Payroll, Live), right column for content.
 */

import type { ReactNode } from "react";
import { CalendarDays, ShieldCheck, DollarSign, Radio } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { MiniBar } from "@/components/mini-bar";

export type TimeReportsTabId = "reports" | "compliance" | "payroll" | "live";

const TIME_REPORTS_TABS: {
  id: TimeReportsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "reports", label: "Shifts", icon: CalendarDays },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "payroll", label: "Payroll", icon: DollarSign },
  { id: "live", label: "Live", icon: Radio },
];

const TAB_TITLES: Record<TimeReportsTabId, string> = {
  reports: "Shifts",
  compliance: "Compliance",
  payroll: "Payroll",
  live: "Live",
};

export interface TimeReportsLayoutProps {
  activeTab: TimeReportsTabId;
  onTabChange: (tab: TimeReportsTabId) => void;
  onBack: () => void;
  /** Optional slot for date range / filters - shown in the right column header area */
  toolbar?: ReactNode;
  children: ReactNode;
}

export function TimeReportsLayout({
  activeTab,
  onTabChange,
  onBack,
  toolbar,
  children,
}: TimeReportsLayoutProps) {
  const title = `Time & Break Reports · ${TAB_TITLES[activeTab]}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <MiniBar
        className="shrink-0"
        title={title}
        onBack={onBack}
        backAriaLabel="Back to Dashboard"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
        {/* Left column: vertical tabs */}
        <nav
          className="w-full shrink-0 sm:w-52 sm:shrink-0 rounded-lg border bg-background p-1"
          aria-label="Time reports sections"
        >
          <ul className="flex flex-col gap-0.5">
            {TIME_REPORTS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                      "hover:bg-muted focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-muted border-l-2 border-primary pl-[10px] text-foreground"
                        : "text-muted-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right column: toolbar + content */}
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          {toolbar ? (
            <div className="shrink-0 mb-3">{toolbar}</div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
