import { CommandCenterDashboard } from "@/features/dashboard/command-center";

/**
 * OperationsOverview (compatibility wrapper)
 *
 * This component remains as a stable import for legacy callers while the
 * implementation now lives in the modular command-center package.
 */
export function OperationsOverview() {
  return <CommandCenterDashboard />;
}
