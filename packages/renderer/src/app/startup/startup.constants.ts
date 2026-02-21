import type { StartupPhase } from "./startup.types";

export const STARTUP_MIN_VISIBLE_MS = 600;
export const STARTUP_PROGRESS_DURATION_MS = 600;
export const UPDATE_SOFT_TIMEOUT_MS = 4000;
export const STARTUP_HARD_TIMEOUT_MS = 15000;

export const STARTUP_PHASE_PROGRESS: Record<StartupPhase, number> = {
  "checking-updates": 20,
  "starting-services": 45,
  "restoring-session": 75,
  finalizing: 92,
  complete: 100,
};

/** Single label shown during entire cold start (no phase-specific text) */
export const SPLASH_LABEL = "Starting AurSwiftEpos";

export const STARTUP_PHASE_LABELS: Record<StartupPhase, string> = {
  "checking-updates": SPLASH_LABEL,
  "starting-services": SPLASH_LABEL,
  "restoring-session": SPLASH_LABEL,
  finalizing: SPLASH_LABEL,
  complete: SPLASH_LABEL,
};
