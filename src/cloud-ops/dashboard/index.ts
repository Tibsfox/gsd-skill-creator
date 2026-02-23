/**
 * Barrel exports for the cloud-ops dashboard module.
 *
 * Re-exports all public functions and types from cloud-ops-panel.ts
 * and doc-console.ts for convenient single-import access.
 *
 * @module cloud-ops/dashboard
 */

// Cloud ops panel functions
export {
  renderCloudOpsPanel,
  renderServiceHealth,
  renderAlertSummary,
  renderMissionTelemetry,
} from './cloud-ops-panel.js';

// Documentation console functions
export {
  renderDocConsole,
  renderDocNavigation,
  renderDocContent,
} from './doc-console.js';

// Shared types
export type {
  ServiceHealthEntry,
  AlertEntry,
  CrewStatus,
  BudgetStatus,
  LoopHealth,
  MissionTelemetry,
  CloudOpsPanelData,
  DocEntry,
  DocContent,
  DocConsoleData,
  // Re-exported OpenStack types
  ServiceStatus,
  OpenStackServiceName,
  CommunicationLoopName,
} from './types.js';
