import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelShell } from "./panel-shell";
import type { HourlyVolumePoint } from "../types/command-center.types";

interface HourlyVolumePanelProps {
  data: HourlyVolumePoint[];
  isLoading: boolean;
}

function HourlyVolumePanelComponent({ data, isLoading }: HourlyVolumePanelProps) {
  return (
    <PanelShell
      title="Hourly Volume"
      subtitle="Transactions per hour"
      className="min-h-[280px] sm:min-h-[320px]"
    >
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          Loading hourly volume...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          No hourly volume data available.
        </div>
      ) : (
        <div className="h-[200px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                interval={1}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  borderRadius: 10,
                  color: "#0f172a",
                }}
              />
              <Bar dataKey="volume" radius={[8, 8, 0, 0]} fill="#818cf8" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelShell>
  );
}

export const HourlyVolumePanel = memo(HourlyVolumePanelComponent);
