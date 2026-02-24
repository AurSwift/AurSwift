import { memo } from "react";
import {
  CircleDollarSign,
  ShoppingCart,
  ReceiptText,
  Users,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { KpiMetric } from "../types/command-center.types";

interface KpiGridProps {
  metrics: KpiMetric[];
}

function iconForMetric(metric: KpiMetric) {
  switch (metric.iconName) {
    case "revenue":
      return CircleDollarSign;
    case "transactions":
      return ShoppingCart;
    case "avg-ticket":
      return ReceiptText;
    default:
      return Users;
  }
}

function directionClasses(direction: KpiMetric["deltaDirection"]): string {
  if (direction === "up") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (direction === "down") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-muted text-muted-foreground";
}

function DirectionIcon({ direction }: { direction: KpiMetric["deltaDirection"] }) {
  if (direction === "up") {
    return <ArrowUpRight className="h-4 w-4" />;
  }

  if (direction === "down") {
    return <ArrowDownRight className="h-4 w-4" />;
  }

  return <Minus className="h-4 w-4" />;
}

function KpiGridComponent({ metrics }: KpiGridProps) {
  return (
    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const MetricIcon = iconForMetric(metric);

        return (
          <article
            key={metric.id}
            className="relative overflow-hidden rounded-lg border border-border/70 bg-card p-2.5 shadow-sm sm:p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-caption text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-kpi-value text-foreground">
                  {metric.value}
                </p>
              </div>

              <MetricIcon className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold sm:px-2.5 sm:text-sm",
                  directionClasses(metric.deltaDirection),
                )}
              >
                <DirectionIcon direction={metric.deltaDirection} />
                {metric.deltaLabel}
              </span>
              <span className="text-caption text-muted-foreground">{metric.subtitle}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export const KpiGrid = memo(KpiGridComponent);
