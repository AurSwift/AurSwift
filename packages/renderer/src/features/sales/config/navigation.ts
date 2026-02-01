/**
 * Sales Feature Navigation Routes
 *
 * Centralized route definitions for the sales feature.
 * These routes are used for navigation throughout the feature.
 */

export const SALES_ROUTES = {
  /** New transaction view */
  NEW_TRANSACTION: "sales:new-transaction",

  /** Sales reports view */
  SALES_REPORTS: "sales:sales-reports",
} as const;

export type SalesRoute = (typeof SALES_ROUTES)[keyof typeof SALES_ROUTES];
