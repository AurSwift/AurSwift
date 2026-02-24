import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { QuickActionItem } from "../types/command-center.types";

interface QuickActionsBarProps {
  actions: QuickActionItem[];
}

function QuickActionsBarComponent({ actions }: QuickActionsBarProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md bg-card p-0">
      <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center">
        <p className="text-body text-muted-foreground shrink-0">
          Quick Actions
        </p>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                className={cn(
                  "h-8 min-h-8 gap-1.5 border-0 bg-muted text-caption text-foreground hover:bg-accent sm:gap-2",
                  action.isPrimary &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                onClick={action.onTrigger}
                disabled={action.disabled}
                title={action.disabledReason || action.shortcut}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">{action.label}</span>
                <span className="rounded-md bg-background/70 px-1 py-0.5 text-[10px] font-medium sm:text-[11px]">
                  {action.shortcut}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const QuickActionsBar = memo(QuickActionsBarComponent);
