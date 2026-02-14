/**
 * Launcher module barrel exports.
 *
 * Re-exports all public types, classes, and functions from the
 * launcher module for convenient single-import access.
 *
 * @module launcher
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  DashboardServiceConfig,
  DashboardServiceStatus,
  DevEnvironmentConfig,
  DevEnvironmentStatus,
} from './types.js';

export type { DashboardGeneratorFn } from './dashboard-service.js';

export type { DevEnvironmentDeps } from './dev-environment.js';

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export { DashboardService } from './dashboard-service.js';
export { DevEnvironmentManager } from './dev-environment.js';
