import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type {
  CommandCenterPeriod,
  PeriodOption,
} from "../types/command-center.types";

interface CommandCenterHeaderProps {
  dateLabel: string;
  period: CommandCenterPeriod;
  periodOptions: PeriodOption[];
  isRefreshing: boolean;
  isDegraded: boolean;
  lastUpdatedAt: string | null;
  onPeriodChange: (period: CommandCenterPeriod) => void;
  onRefresh: () => Promise<void>;
}

function formatLastUpdated(timestamp: string | null): string {
  if (!timestamp) return "Waiting for first sync";

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) {
    return "Waiting for first sync";
  }

  return `Updated ${parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function CommandCenterHeader({
  dateLabel,
  period,
  periodOptions,
  isRefreshing,
  isDegraded,
  lastUpdatedAt,
  onPeriodChange,
  onRefresh,
}: CommandCenterHeaderProps) {
  return (
    <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-body text-muted-foreground">{dateLabel}</p>
        <p
          className={cn(
            "mt-0.5 text-caption",
            isDegraded ? "text-amber-700" : "text-emerald-700",
          )}
        >
          {isDegraded
            ? "Some data sources are temporarily unavailable"
            : "Data feed healthy"}
          <span className="ml-1.5 sm:ml-2 text-muted-foreground">{formatLastUpdated(lastUpdatedAt)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div
          className="inline-flex rounded-md bg-muted p-0.5"
          role="radiogroup"
          aria-label="Dashboard period selector"
        >
          {periodOptions.map((option) => {
            const active = option.id === period;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={option.description}
                className={cn(
                  "rounded-md px-2 py-1 text-caption font-medium transition-colors sm:px-2.5",
                  active
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
                onClick={() => onPeriodChange(option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-8 min-h-8 border-0 bg-muted text-caption text-foreground hover:bg-accent"
          onClick={() => {
            void onRefresh();
          }}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>
    </header>
  );
}
