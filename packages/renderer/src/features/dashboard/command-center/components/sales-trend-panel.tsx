import { memo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelShell } from "./panel-shell";
import type { SalesTrendPoint } from "../types/command-center.types";

interface SalesTrendPanelProps {
  data: SalesTrendPoint[];
  isLoading: boolean;
}

function SalesTrendPanelComponent({ data, isLoading }: SalesTrendPanelProps) {
  return (
    <PanelShell
      title="Sales Trend"
      subtitle="Today vs yesterday"
      className="min-h-[280px] sm:min-h-[320px]"
      rightSlot={
        <div className="flex flex-shrink-0 items-center gap-2 text-caption text-muted-foreground sm:gap-3">
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 sm:h-2.5 sm:w-2.5" />
            Today
          </span>
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-400 sm:h-2.5 sm:w-2.5" />
            Yesterday
          </span>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          Loading trend data...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          No trend data available for the selected period.
        </div>
      ) : (
        <div className="h-[200px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                width={44}
                tickFormatter={(value) =>
                  Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: 10,
                  color: "#0f172a",
                }}
                formatter={(value: number) => [`GBP${Number(value).toFixed(2)}`, ""]}
              />
              <Line
                type="monotone"
                dataKey="today"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="yesterday"
                stroke="#94a3b8"
                strokeDasharray="6 4"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelShell>
  );
}

export const SalesTrendPanel = memo(SalesTrendPanelComponent);
