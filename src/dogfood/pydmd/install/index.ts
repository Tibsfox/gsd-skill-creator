/**
 * Install pipeline for external Python projects.
 * Phase 404: python-detector, venv-manager, health-check
 */
export { detectPythonProject } from './python-detector.js';
export { createVenv, cleanupVenv } from './venv-manager.js';
export type { CommandExecutor } from './venv-manager.js';
