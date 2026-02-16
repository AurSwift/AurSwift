/**
 * Settings Layout
 *
 * Shared two-column layout for settings views: MiniBar at top,
 * left sidebar with section tabs, right column for form content.
 */

import type { ReactNode } from "react";
import { Settings, Building2, CreditCard } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { MiniBar } from "@/components/mini-bar";
import { useNavigation } from "@/navigation/hooks/use-navigation";
import { SETTINGS_ROUTES } from "../config/navigation";
import type { SettingsRoute } from "../config/navigation";

const SETTINGS_TABS: {
  id: SettingsRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: SETTINGS_ROUTES.GENERAL, label: "General Settings", icon: Settings },
  {
    id: SETTINGS_ROUTES.STORE_CONFIGURATION,
    label: "Terminal Configuration",
    icon: Building2,
  },
  { id: SETTINGS_ROUTES.VIVA_WALLET, label: "Viva Wallet", icon: CreditCard },
];

const ACTIVE_TAB_TITLES: Record<SettingsRoute, string> = {
  [SETTINGS_ROUTES.GENERAL]: "General Settings",
  [SETTINGS_ROUTES.STORE_CONFIGURATION]: "Terminal Configuration",
  [SETTINGS_ROUTES.VIVA_WALLET]: "Viva Wallet Settings",
};

export interface SettingsLayoutProps {
  activeTab: SettingsRoute;
  onBack: () => void;
  children: ReactNode;
}

export function SettingsLayout({
  activeTab,
  onBack,
  children,
}: SettingsLayoutProps) {
  const { navigateTo } = useNavigation();
  const title = ACTIVE_TAB_TITLES[activeTab];

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
          aria-label="Settings sections"
        >
          <ul className="flex flex-col gap-0.5">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(tab.id)}
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

        {/* Right column: form content */}
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
