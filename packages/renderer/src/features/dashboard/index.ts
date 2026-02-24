/**
 * Dashboard Features
 *
 * Central export for all dashboard-related features, components, and hooks.
 */

// Components
export {
  DashboardHeader,
  CommandCenterDashboard,
  FeatureMenuBar,
  LicenseHeaderBadge,
  OperationsOverview,
  LogoutConfirmationDialog,
} from "./components";

// Shell Components
export {
  BackOfficeShell,
  BackOfficeSidebar,
  BackOfficeTopbar,
} from "./shell";

// Hooks
export { useUserPermissions, useFeatureVisibility } from "./hooks";

// Registry
export {
  FEATURE_REGISTRY,
  getFeaturesByCategory,
  getFeatureById,
  getAllFeatureIds,
} from "./registry";

// Types
export type {
  FeatureConfig,
  FeatureAction,
  FeatureStats,
  FeatureCategory,
} from "./types";

export type { CommandCenterPeriod } from "./command-center";

// Views (DashboardView only; role-specific views are lazy-loaded via DashboardPageWrapper)
export { DashboardView } from "./views";
