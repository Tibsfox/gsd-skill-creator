// Types
export type { DashboardPage, GenerateRequest, GenerateResponse, DashboardConfig } from "./types";
export { DASHBOARD_PAGES } from "./types";

// IPC
export { generateDashboard, generateAllPages } from "./ipc";

// Host
export { DashboardHost } from "./dashboard-host";
export type { DashboardHostOptions } from "./dashboard-host";

// Watcher refresh
export { WatcherRefresh } from "./watcher-refresh";
export type { WatcherRefreshOptions } from "./watcher-refresh";

// Palette bridge
export type { PaletteConfig } from "./palette-bridge";
export { DEFAULT_PALETTE, paletteToCssVars, applyPalette, removePalette } from "./palette-bridge";

// Math Co-Processor panel
export { MathPanel } from "./math-panel";
export type { ChipStatus, VRAMStatus, StreamStatus, OperationRecord, MathPanelData } from "./math-panel";
