import { memo } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  formatCompactCurrency,
  formatPercent,
} from "../mappers/command-center-mappers";
import { PanelShell } from "./panel-shell";
import type { TopSellerItem } from "../types/command-center.types";

interface TopSellersPanelProps {
  items: TopSellerItem[];
  isLoading: boolean;
}

function ChangeIndicator({ value, className }: { value: number; className?: string }) {
  const base = "inline-flex items-center gap-1 text-caption sm:text-sm";
  if (value > 0.01) {
    return (
      <span className={cn(base, "text-emerald-700", className)}>
        <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {formatPercent(value)}
      </span>
    );
  }

  if (value < -0.01) {
    return (
      <span className={cn(base, "text-rose-700", className)}>
        <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {formatPercent(Math.abs(value))}
      </span>
    );
  }

  return (
    <span className={cn(base, "text-muted-foreground", className)}>
      <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      0.0%
    </span>
  );
}

function TopSellersPanelComponent({ items, isLoading }: TopSellersPanelProps) {
  return (
    <PanelShell
      title="Top Sellers"
      subtitle="Best performing items"
      className="min-h-[280px] flex flex-col sm:min-h-[320px]"
    >
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          Loading top sellers...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          No product sales data available.
        </div>
      ) : (
        <ul className="h-[200px] min-h-0 space-y-1.5 overflow-y-auto pr-1 sm:h-[220px] sm:space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md bg-card px-1.5 py-1 sm:px-2 sm:py-1.5"
            >
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-caption font-semibold text-muted-foreground sm:h-7 sm:w-7">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-body text-foreground">{item.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {item.quantity} units | {formatCompactCurrency(item.revenue)}
                  </p>
                </div>
              </div>

              <ChangeIndicator value={item.changePercent} className="shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export const TopSellersPanel = memo(TopSellersPanelComponent);
