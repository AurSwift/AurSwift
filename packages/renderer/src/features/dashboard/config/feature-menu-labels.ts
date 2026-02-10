import type { FeatureConfig } from "../types/feature-config";

export const FEATURE_MENU_LABELS: Record<string, string> = {
  "user-management": "Users",
  "management-actions": "Inventory",
  "time-breaks": "Time & Attendance",
  "system-settings": "Settings",
  "database-management": "Database",
  "advanced-reporting-analytics": "Reports & Analytics",
  "quick-actions": "Quick Actions",
};

export function getFeatureMenuLabel(feature: FeatureConfig): string {
  return FEATURE_MENU_LABELS[feature.id] ?? feature.title;
}
