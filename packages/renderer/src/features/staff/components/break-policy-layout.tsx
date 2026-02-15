/**
 * Break Policy Layout
 *
 * Two-column layout for Break Policies: MiniBar at top,
 * left sidebar with section tabs (Break Types, Policy Rules, Settings),
 * right column for content.
 */

import type { ReactNode } from "react";
import { Coffee, ListChecks, Settings } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { MiniBar } from "@/components/mini-bar";

export type BreakPolicyTabId = "types" | "rules" | "settings";

const BREAK_POLICY_TABS: {
  id: BreakPolicyTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "types", label: "Break Types", icon: Coffee },
  { id: "rules", label: "Policy Rules", icon: ListChecks },
  { id: "settings", label: "Settings", icon: Settings },
];

const TAB_TITLES: Record<BreakPolicyTabId, string> = {
  types: "Break Types",
  rules: "Policy Rules",
  settings: "Settings",
};

export interface BreakPolicyLayoutProps {
  activeTab: BreakPolicyTabId;
  onTabChange: (tab: BreakPolicyTabId) => void;
  onBack: () => void;
  children: ReactNode;
}

export function BreakPolicyLayout({
  activeTab,
  onTabChange,
  onBack,
  children,
}: BreakPolicyLayoutProps) {
  const title = `Break Policies · ${TAB_TITLES[activeTab]}`;

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
          aria-label="Break policy sections"
        >
          <ul className="flex flex-col gap-0.5">
            {BREAK_POLICY_TABS.map((tab) => {
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

        {/* Right column: content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
