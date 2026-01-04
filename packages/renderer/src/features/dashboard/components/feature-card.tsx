/**
 * FeatureCard Component
 *
 * Base component for rendering dashboard feature cards.
 * Automatically handles permission-based visibility and action rendering.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFeatureVisibility } from "../hooks/use-feature-visibility";
import { useUserPermissions } from "../hooks/use-user-permissions";
import type { FeatureConfig } from "../types/feature-config";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("feature-card");

interface FeatureCardProps {
  feature: FeatureConfig;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const isVisible = useFeatureVisibility(feature);
  const { hasAnyPermission, isLoading } = useUserPermissions();

  // Don't render if feature is not visible (also waits for permissions to load)
  if (!isVisible) return null;

  const Icon = feature.icon;

  // Filter actions based on permissions
  const visibleActions = feature.actions.filter((action) => {
    // If still loading permissions, hide actions that require permissions
    if (isLoading && action.permissions && action.permissions.length > 0) {
      return false;
    }

    // Check if user has permission for this specific action
    if (action.permissions && action.permissions.length > 0) {
      return hasAnyPermission(action.permissions);
    }

    // No permissions required, show action
    return true;
  });

  // Don't render card if no visible actions
  if (visibleActions.length === 0) return null;

  return (
    <Card className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Icon className="w-5 h-5 shrink-0" />
          {feature.title}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {visibleActions.map((action) => {
          const ActionIcon = action.icon;

          return (
            <Button
              key={action.id}
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10 touch-manipulation"
              variant={action.variant || "outline"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug(`Button clicked: ${feature.id} -> ${action.id}`);
                if (action.onClick) {
                  action.onClick();
                } else {
                  logger.warn(`No onClick handler for action: ${action.id}`);
                }
              }}
              disabled={action.disabled}
            >
              <ActionIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 shrink-0" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
