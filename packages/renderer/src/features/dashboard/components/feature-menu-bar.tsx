import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { UpgradeBadge } from "@/features/subscription";
import { useFeatureVisibility } from "../hooks/use-feature-visibility";
import { useUserPermissions } from "../hooks/use-user-permissions";
import type { FeatureConfig } from "../types/feature-config";
import { cn } from "@/shared/utils/cn";
import { getFeatureMenuLabel } from "../config/feature-menu-labels";

interface FeatureMenuBarProps {
  features: FeatureConfig[];
  onActionClick: (featureId: string, actionId: string) => void;
  className?: string;
}

function FeatureMenuGroup({
  feature,
  onActionClick,
  onClose,
}: {
  feature: FeatureConfig;
  onActionClick: (featureId: string, actionId: string) => void;
  onClose: () => void;
}) {
  const visibility = useFeatureVisibility(feature);
  const { hasAnyPermission, isLoading } = useUserPermissions();

  const isSettingsMenu = feature.id === "system-settings";
  if (!visibility.isVisible && !isSettingsMenu) return null;

  const visibleActions = feature.actions.filter((action) => {
    if (isLoading && action.permissions && action.permissions.length > 0) {
      return false;
    }
    if (action.permissions && action.permissions.length > 0) {
      return hasAnyPermission(action.permissions);
    }
    return true;
  });

  const settingsExtras =
    isSettingsMenu
      ? [
          { id: "show-license-info", label: "Show license info" },
          { id: "change-pin", label: "Change PIN" },
          { id: "logout", label: "Log out" },
          { id: "quit-app", label: "Quit App" },
        ]
      : [];

  if (visibleActions.length === 0 && settingsExtras.length === 0) return null;

  const label = getFeatureMenuLabel(feature);

  return (
    <NavigationMenuItem value={feature.id}>
      <NavigationMenuTrigger className="h-8 px-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=open]:text-foreground data-[state=open]:bg-transparent bg-transparent hover:bg-transparent [&>svg]:hidden">
        <span className="flex items-center gap-2">
          {label}
          {visibility.requiresUpgrade &&
            visibility.isVisible &&
            visibility.upgradeInfo && (
            <UpgradeBadge
              message={visibility.upgradeInfo.message}
              planId={visibility.upgradeInfo.planId}
              size="sm"
              variant="outline"
              className="ml-1"
            />
          )}
        </span>
      </NavigationMenuTrigger>
      <NavigationMenuContent className="min-w-[220px] p-2 z-[60] bg-background/95 backdrop-blur border shadow-lg">
        <div className="flex flex-col gap-1">
          {visibleActions.map((action) => {
            const ActionIcon = action.icon;
            const isDisabled = action.disabled || !visibility.canAccess;
            const variant = action.variant || "outline";
            const variantClass =
              variant === "destructive"
                ? "text-destructive hover:bg-destructive/10"
                : variant === "default"
                ? "text-primary hover:bg-primary/10"
                : "text-foreground hover:bg-accent";

            return (
              <button
                key={action.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  variantClass,
                  isDisabled &&
                    "opacity-50 cursor-not-allowed hover:bg-transparent"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (isDisabled) return;
                  onActionClick(feature.id, action.id);
                  onClose();
                }}
                disabled={isDisabled}
                title={
                  isDisabled && visibility.upgradeInfo?.planId
                    ? `Upgrade to ${visibility.upgradeInfo.planId} plan to access this feature`
                    : undefined
                }
              >
                <ActionIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{action.label}</span>
              </button>
            );
          })}
          {settingsExtras.length > 0 && (
            <>
              <div className="my-1 h-px bg-border" />
              {settingsExtras.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onActionClick("system-settings", item.id);
                    onClose();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </>
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

export function FeatureMenuBar({
  features,
  onActionClick,
  className = "",
}: FeatureMenuBarProps) {
  const [openItem, setOpenItem] = useState<string>("");

  return (
    <NavigationMenu
      viewport={false}
      value={openItem}
      onValueChange={setOpenItem}
      className={cn("w-full justify-start overflow-visible", className)}
    >
      <NavigationMenuList className="justify-start gap-4 flex-nowrap overflow-visible">
        {features.map((feature) => (
          <FeatureMenuGroup
            key={feature.id}
            feature={feature}
            onActionClick={onActionClick}
            onClose={() => setOpenItem("")}
          />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
