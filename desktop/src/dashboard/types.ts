/**
 * Dashboard IPC types for the desktop webview.
 *
 * These types define the contract between the webview frontend and the
 * Rust backend for dashboard generation via Tauri IPC.
 */

/** Union of all dashboard page names. */
export type DashboardPage =
  | "index"
  | "requirements"
  | "roadmap"
  | "milestones"
  | "state"
  | "console";

/** Ordered list of all dashboard page names. */
export const DASHBOARD_PAGES: readonly DashboardPage[] = [
  "index",
  "requirements",
  "roadmap",
  "milestones",
  "state",
  "console",
] as const;

/** Request payload for the generate_dashboard IPC command. */
export interface GenerateRequest {
  page: DashboardPage;
  planningDir: string;
  force?: boolean;
}

/** Response payload from the generate_dashboard IPC command. */
export interface GenerateResponse {
  html: string;
  page: DashboardPage;
  duration: number;
  error?: string;
}

/** Configuration for dashboard generation. */
export interface DashboardConfig {
  planningDir: string;
  outputDir?: string;
}
