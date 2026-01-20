/**
 * App Flow Context
 *
 * Small shared state for app-wide UI flow decisions (e.g. whether to suppress
 * certain global toasts during onboarding / activation screens).
 */
import React, { createContext, useContext, useMemo, useState } from "react";

interface AppFlowContextValue {
  suppressUpdateToasts: boolean;
  setSuppressUpdateToasts: (value: boolean) => void;
}

const AppFlowContext = createContext<AppFlowContextValue | null>(null);

export function AppFlowProvider({ children }: { children: React.ReactNode }) {
  // Default to suppress until App decides which screen is showing.
  const [suppressUpdateToasts, setSuppressUpdateToasts] = useState(true);

  const value = useMemo<AppFlowContextValue>(
    () => ({ suppressUpdateToasts, setSuppressUpdateToasts }),
    [suppressUpdateToasts]
  );

  return (
    <AppFlowContext.Provider value={value}>{children}</AppFlowContext.Provider>
  );
}

export function useAppFlow(): AppFlowContextValue {
  const ctx = useContext(AppFlowContext);
  if (!ctx) {
    throw new Error("useAppFlow must be used within an AppFlowProvider");
  }
  return ctx;
}
