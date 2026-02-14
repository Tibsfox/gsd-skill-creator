/**
 * IPC wrapper functions for dashboard commands.
 *
 * Bridges the webview to the Rust generate_dashboard command via Tauri invoke.
 */

import type { DashboardPage, GenerateResponse } from "./types";

/**
 * Generate a single dashboard page via the Rust backend.
 *
 * Invokes the `generate_dashboard` Tauri command which shells out to
 * Node.js to run the dashboard generator.
 */
export async function generateDashboard(
  _page: DashboardPage,
  _planningDir: string,
): Promise<GenerateResponse> {
  throw new Error("not implemented");
}

/**
 * Generate all 6 dashboard pages via the Rust backend.
 *
 * Calls generateDashboard for each page in DASHBOARD_PAGES.
 */
export async function generateAllPages(
  _planningDir: string,
): Promise<GenerateResponse[]> {
  throw new Error("not implemented");
}
