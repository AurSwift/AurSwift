import { describe, expect, it } from "vitest";
import { mapActionToView } from "../../../../../packages/renderer/src/features/navigation/utils/navigation-mapper";
import { SALES_ROUTES } from "../../../../../packages/renderer/src/features/sales/config/navigation";
import { STAFF_ROUTES } from "../../../../../packages/renderer/src/features/staff/config/navigation";
import { INVENTORY_ROUTES } from "../../../../../packages/renderer/src/features/inventory/config/navigation";

describe("mapActionToView", () => {
  it("maps advanced-reporting-analytics actions to supported routes", () => {
    expect(
      mapActionToView("advanced-reporting-analytics", "sales-reports"),
    ).toBe(SALES_ROUTES.SALES_REPORTS);
    expect(
      mapActionToView("advanced-reporting-analytics", "staff-reports"),
    ).toBe(STAFF_ROUTES.TIME_REPORTS);
  });

  it("maps management-actions inventory navigation to canonical inventory routes", () => {
    expect(
      mapActionToView("management-actions", "manage-inventory"),
    ).toBe(INVENTORY_ROUTES.PRODUCT_MANAGEMENT);
  });

  it("keeps unsupported advanced-reporting-analytics actions unmapped", () => {
    expect(
      mapActionToView("advanced-reporting-analytics", "inventory-reports"),
    ).toBeUndefined();
    expect(
      mapActionToView("advanced-reporting-analytics", "business-intelligence"),
    ).toBeUndefined();
  });
});
