import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_MIX_COLORS } from "../constants/command-center-defaults";
import { PanelShell } from "./panel-shell";
import type { CategoryMixItem } from "../types/command-center.types";

interface CategoryMixPanelProps {
  data: CategoryMixItem[];
  isLoading: boolean;
}

function CategoryMixPanelComponent({ data, isLoading }: CategoryMixPanelProps) {
  return (
    <PanelShell
      title="Categories"
      subtitle="Revenue distribution"
      className="min-h-[280px] flex flex-col sm:min-h-[320px]"
    >
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          Loading category mix...
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-body text-muted-foreground sm:h-[220px]">
          No category distribution data available.
        </div>
      ) : (
        <div className="grid gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_140px] xl:grid-cols-[minmax(0,1fr)_160px]">
          <div className="h-[200px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    borderRadius: 10,
                    color: "#0f172a",
                  }}
                  formatter={(value: number) => [`${Number(value).toFixed(1)}%`, "Share"]}
                />
                <Pie
                  data={data}
                  dataKey="percentage"
                  nameKey="label"
                  innerRadius={50}
                  outerRadius={76}
                  stroke="#ffffff"
                  strokeWidth={2}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.id}
                      fill={CATEGORY_MIX_COLORS[index % CATEGORY_MIX_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="h-[200px] min-h-0 space-y-1 overflow-y-auto pr-1 sm:h-[220px] sm:space-y-1.5">
            {data.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-1.5 text-caption sm:gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground sm:gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_MIX_COLORS[index % CATEGORY_MIX_COLORS.length],
                    }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">{item.percentage.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelShell>
  );
}

export const CategoryMixPanel = memo(CategoryMixPanelComponent);
