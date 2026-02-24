import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "../mappers/command-center-mappers";
import { PanelShell } from "./panel-shell";
import type { LiveActivityItem } from "../types/command-center.types";

interface LiveActivityPanelProps {
  items: LiveActivityItem[];
  isLoading: boolean;
}

function dotClassForSeverity(severity: LiveActivityItem["severity"]): string {
  if (severity === "critical") return "bg-rose-500";
  if (severity === "warning") return "bg-amber-400";
  if (severity === "success") return "bg-emerald-400";
  return "bg-sky-400";
}

function LiveActivityPanelComponent({ items, isLoading }: LiveActivityPanelProps) {
  return (
    <PanelShell
      title="Live Activity"
      subtitle="Operational stream"
      className="min-h-[280px] flex flex-col sm:min-h-[320px]"
      rightSlot={
        <Badge className="border-0 bg-emerald-100 px-1.5 py-0 text-caption text-emerald-700 sm:px-2">
          Live
        </Badge>
      }
    >
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          Loading activity feed...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          No activity events are available yet.
        </div>
      ) : (
        <ul className="h-[220px] min-h-0 space-y-1.5 overflow-y-auto pr-1 sm:h-[240px] sm:space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-1.5 rounded-md border border-border/60 bg-muted/20 p-1.5 sm:gap-2 sm:p-2"
            >
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full sm:h-3 sm:w-3",
                  dotClassForSeverity(item.severity),
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-body text-foreground">{item.message}</p>
                <p className="mt-0.5 text-caption text-muted-foreground">
                  {item.sourceLabel} | {formatRelativeTime(item.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export const LiveActivityPanel = memo(LiveActivityPanelComponent);
