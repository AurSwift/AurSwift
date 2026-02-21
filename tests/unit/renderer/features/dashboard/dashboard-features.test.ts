import { describe, expect, it } from "vitest";
import { getDashboardFeaturesForRole } from "@/features/dashboard/utils/dashboard-features";

describe("getDashboardFeaturesForRole", () => {
  it("excludes advanced-reporting-analytics for managers", () => {
    const managerFeatureIds = getDashboardFeaturesForRole("manager").map(
      (feature) => feature.id,
    );

    expect(managerFeatureIds).not.toContain("advanced-reporting-analytics");
    expect(managerFeatureIds).not.toContain("database-management");
    expect(managerFeatureIds).not.toContain("quick-actions");
  });

  it("keeps advanced-reporting-analytics for admins", () => {
    const adminFeatureIds = getDashboardFeaturesForRole("admin").map(
      (feature) => feature.id,
    );

    expect(adminFeatureIds).toContain("advanced-reporting-analytics");
    expect(adminFeatureIds).not.toContain("quick-actions");
  });
});
