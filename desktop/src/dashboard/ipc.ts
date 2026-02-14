/**
 * IPC wrapper functions for dashboard commands.
 *
 * Bridges the webview to the Rust generate_dashboard command via Tauri invoke.
 */

import { invoke } from "@tauri-apps/api/core";
import { DASHBOARD_PAGES } from "./types";
import type { DashboardPage, GenerateResponse } from "./types";

/**
 * Generate a single dashboard page via the Rust backend.
 *
 * Invokes the `generate_dashboard` Tauri command which shells out to
 * Node.js to run the dashboard generator.
 */
export async function generateDashboard(
  page: DashboardPage,
  planningDir: string,
): Promise<GenerateResponse> {
  return invoke<GenerateResponse>("generate_dashboard", { page, planningDir });
}

/**
 * Generate all 6 dashboard pages via the Rust backend.
 *
 * Calls generateDashboard for each page in DASHBOARD_PAGES.
 */
export async function generateAllPages(
  planningDir: string,
): Promise<GenerateResponse[]> {
  return Promise.all(
    DASHBOARD_PAGES.map((page) => generateDashboard(page, planningDir)),
  );
}
