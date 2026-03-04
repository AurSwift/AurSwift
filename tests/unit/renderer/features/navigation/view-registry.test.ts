import { describe, expect, it } from "vitest";
import { getView } from "../../../../../packages/renderer/src/features/navigation/registry/view-registry";
import { RBAC_ROUTES } from "../../../../../packages/renderer/src/features/rbac/config/navigation";
import { USERS_ROUTES } from "../../../../../packages/renderer/src/features/users/config/navigation";
import { SALES_ROUTES } from "../../../../../packages/renderer/src/features/sales/config/navigation";
import { STAFF_ROUTES } from "../../../../../packages/renderer/src/features/staff/config/navigation";
import { SETTINGS_ROUTES } from "../../../../../packages/renderer/src/features/settings/config/navigation";

describe("view-registry legacy removal", () => {
  it("does not resolve removed legacy route aliases", () => {
    expect(getView("roleManagement")).toBeUndefined();
    expect(getView("userRoleAssignment")).toBeUndefined();
    expect(getView("userManagement")).toBeUndefined();
    expect(getView("newTransaction")).toBeUndefined();
    expect(getView("staffSchedules")).toBeUndefined();
    expect(getView("cashierManagement")).toBeUndefined();
    expect(getView("generalSettings")).toBeUndefined();
  });

  it("resolves canonical route constants", () => {
    expect(getView(RBAC_ROUTES.ROLE_MANAGEMENT)).toBeDefined();
    expect(getView(USERS_ROUTES.MANAGEMENT)).toBeDefined();
    expect(getView(SALES_ROUTES.NEW_TRANSACTION)).toBeDefined();
    expect(getView(STAFF_ROUTES.SCHEDULES)).toBeDefined();
    expect(getView(SETTINGS_ROUTES.GENERAL)).toBeDefined();
  });
});
