import { FEATURE_REGISTRY } from "../registry/feature-registry";
import type { FeatureConfig } from "../types/feature-config";

const ADMIN_EXCLUDED = new Set(["quick-actions"]);
const MANAGER_EXCLUDED = new Set([
  "database-management",
  "advanced-reports",
  "quick-actions",
]);

export function getDashboardFeaturesForRole(role?: string): FeatureConfig[] {
  if (role === "manager") {
    return FEATURE_REGISTRY.filter((feature) => !MANAGER_EXCLUDED.has(feature.id));
  }

  if (role === "admin") {
    return FEATURE_REGISTRY.filter((feature) => !ADMIN_EXCLUDED.has(feature.id));
  }

  if (role === "cashier") {
    return [];
  }

  // Default to admin-style filtering for unknown roles.
  return FEATURE_REGISTRY.filter((feature) => !ADMIN_EXCLUDED.has(feature.id));
}
