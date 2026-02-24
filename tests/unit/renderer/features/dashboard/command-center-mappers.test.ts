import { describe, expect, it } from "vitest";
import {
  buildCategoryMix,
  buildHourlyVolume,
  buildKpiMetrics,
  buildLiveActivityItems,
  buildTopSellers,
  getCommandCenterDateRange,
} from "@/features/dashboard/command-center";
import type { Transaction } from "@/features/sales/components/sales-reports";

function createTransaction(partial: Partial<Transaction>): Transaction {
  return {
    id: partial.id || "txn",
    receiptNumber: partial.receiptNumber || "R-1",
    timestamp: partial.timestamp || new Date().toISOString(),
    total: partial.total ?? 0,
    paymentMethod: partial.paymentMethod || "card",
    items: partial.items || [],
    type: partial.type || "sale",
    status: partial.status || "completed",
    cashierName: partial.cashierName,
    shiftId: partial.shiftId,
    userId: partial.userId,
  };
}

describe("command-center-mappers", () => {
  it("calculates KPI values and labor delta from live transactions", () => {
    const now = new Date("2026-02-23T12:00:00.000Z");
    const range = getCommandCenterDateRange("today", now);

    const transactions: Transaction[] = [
      createTransaction({
        id: "t1",
        timestamp: "2026-02-23T08:00:00.000Z",
        total: 120,
      }),
      createTransaction({
        id: "t2",
        timestamp: "2026-02-23T10:00:00.000Z",
        total: 80,
      }),
      createTransaction({
        id: "t3",
        timestamp: "2026-02-22T09:00:00.000Z",
        total: 100,
      }),
    ];

    const metrics = buildKpiMetrics({
      statistics: null,
      transactions,
      periodRange: range,
      laborCostPercent: 22,
      previousLaborCostPercent: 28,
    });

    expect(metrics[0].value).toContain("200");
    expect(metrics[1].value).toBe("2");
    expect(metrics[2].value).toContain("100");
    expect(metrics[3].value).toBe("22.0%");
    expect(metrics[3].deltaDirection).toBe("up");
  });

  it("builds top sellers by aggregating quantity and revenue", () => {
    const now = new Date("2026-02-23T12:00:00.000Z");
    const range = getCommandCenterDateRange("today", now);

    const transactions: Transaction[] = [
      createTransaction({
        id: "sale-1",
        timestamp: "2026-02-23T08:00:00.000Z",
        total: 90,
        items: [
          {
            id: "i1",
            productId: "p-burger",
            productName: "Classic Burger",
            quantity: 3,
            unitPrice: 10,
            totalPrice: 30,
          },
          {
            id: "i2",
            productId: "p-pizza",
            productName: "Pizza",
            quantity: 2,
            unitPrice: 15,
            totalPrice: 30,
          },
        ],
      }),
      createTransaction({
        id: "sale-2",
        timestamp: "2026-02-23T09:00:00.000Z",
        total: 60,
        items: [
          {
            id: "i3",
            productId: "p-burger",
            productName: "Classic Burger",
            quantity: 4,
            unitPrice: 10,
            totalPrice: 40,
          },
        ],
      }),
    ];

    const topSellers = buildTopSellers({
      transactions,
      periodRange: range,
    });

    expect(topSellers[0].name).toBe("Classic Burger");
    expect(topSellers[0].quantity).toBe(7);
    expect(topSellers[0].revenue).toBe(70);
  });

  it("groups unknown products into Uncategorized category mix", () => {
    const now = new Date("2026-02-23T12:00:00.000Z");
    const range = getCommandCenterDateRange("today", now);

    const transactions: Transaction[] = [
      createTransaction({
        id: "sale-1",
        timestamp: "2026-02-23T08:00:00.000Z",
        total: 30,
        items: [
          {
            id: "i1",
            productId: "p-unknown",
            productName: "Mystery Item",
            quantity: 1,
            unitPrice: 30,
            totalPrice: 30,
          },
        ],
      }),
    ];

    const categoryMix = buildCategoryMix({
      transactions,
      products: [],
      categories: [],
      periodRange: range,
    });

    expect(categoryMix).toHaveLength(1);
    expect(categoryMix[0].label).toBe("Uncategorized");
    expect(categoryMix[0].percentage).toBe(100);
  });

  it("builds hourly volume points from completed sales", () => {
    const now = new Date("2026-02-23T12:00:00.000Z");

    const transactions: Transaction[] = [
      createTransaction({
        id: "sale-1",
        timestamp: "2026-02-23T06:15:00.000Z",
        total: 20,
      }),
      createTransaction({
        id: "sale-2",
        timestamp: "2026-02-23T06:35:00.000Z",
        total: 25,
      }),
      createTransaction({
        id: "sale-3",
        timestamp: "2026-02-23T08:20:00.000Z",
        total: 30,
      }),
      createTransaction({
        id: "refund-1",
        timestamp: "2026-02-23T08:40:00.000Z",
        total: -10,
        type: "refund",
      }),
    ];

    const hourly = buildHourlyVolume(transactions, now);
    const sixAm = hourly.find((point) => point.label === "6AM");
    const eightAm = hourly.find((point) => point.label === "8AM");

    expect(sixAm?.volume).toBe(2);
    expect(eightAm?.volume).toBe(1);
  });

  it("orders live activity items by latest timestamp and includes low stock signal", () => {
    const now = new Date("2026-02-23T12:00:00.000Z");

    const transactions: Transaction[] = [
      createTransaction({
        id: "sale-recent",
        timestamp: "2026-02-23T11:59:00.000Z",
        total: 50,
      }),
      createTransaction({
        id: "sale-old",
        timestamp: "2026-02-23T11:40:00.000Z",
        total: 30,
      }),
    ];

    const items = buildLiveActivityItems({
      transactions,
      inventoryStats: { lowStockCount: 3 },
      realtime: { currentlyWorking: 4, activeBreaks: 1 },
      businessName: "Demo Store",
      now,
    });

    expect(items[0].id).toBe("txn-sale-recent");
    expect(items.some((item) => item.id === "inventory-low-stock")).toBe(true);
  });
});
