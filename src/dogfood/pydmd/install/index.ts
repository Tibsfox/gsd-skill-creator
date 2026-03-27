/**
 * Install pipeline for external Python projects.
 * Phase 404: python-detector, venv-manager, health-check
 *
 * Orchestrates: detect -> venv -> health-check -> InstallManifest
 */

import type {
  InstallManifest,
  VenvConfig,
  HealthCheckConfig,
} from '../types.js';
import { detectPythonProject } from './python-detector.js';
import { createVenv, cleanupVenv } from './venv-manager.js';
import { runHealthCheck } from './health-check.js';
import type { CommandExecutor } from './venv-manager.js';

// --- Re-exports ---

export { detectPythonProject } from './python-detector.js';
export { createVenv, cleanupVenv } from './venv-manager.js';
export { runHealthCheck } from './health-check.js';
export type { CommandExecutor } from './venv-manager.js';

// --- Pipeline orchestrator ---

/**
 * Run the full install pipeline: detect -> venv -> health-check.
 *
 * @param projectPath - Absolute path to the cloned Python project
 * @param files - Map of filename -> content for key config files
 * @param dirEntries - List of directory entries (paths relative to project root)
 * @param exec - Optional command executor (injected in tests)
 * @returns InstallManifest with project info, venv result, and health report
 */
export async function runInstallPipeline(
  projectPath: string,
  files: Record<string, string>,
  dirEntries: string[],
  exec?: CommandExecutor,
): Promise<InstallManifest> {
  // Step 1: Detect Python project
  const projectInfo = detectPythonProject(files, dirEntries);

  if (!projectInfo.isPython) {
    throw new Error('Not a Python project');
  }

  // Step 2: Build venv config and create venv
  const venvConfig: VenvConfig = {
    projectPath,
    venvPath: `${projectPath}/.sc-venv`,
    pythonVersion: projectInfo.pythonRequires
      ? projectInfo.pythonRequires.replace(/[><=!~]/g, '').split('.').slice(0, 2).join('.')
      : '3',
    installGroups: ['core', 'test'],
  };

  const venvArgs: Parameters<typeof createVenv> = [venvConfig, projectInfo];
  if (exec) venvArgs.push(exec);
  const venvResult = await createVenv(...venvArgs);

  if (!venvResult.success) {
    throw new Error(`Venv creation failed: ${venvResult.installErrors.join('; ')}`);
  }

  // Step 3: Build health check config and run
  const healthConfig: HealthCheckConfig = {
    venvResult,
    projectPath,
    testFramework: projectInfo.testFramework === 'pytest' || projectInfo.testFramework === 'unittest'
      ? projectInfo.testFramework
      : 'pytest',
    timeout: 300,
    maxTestOutput: 65536,
  };

  const healthArgs: Parameters<typeof runHealthCheck> = [healthConfig];
  if (exec) healthArgs.push(exec);
  const healthReport = await runHealthCheck(...healthArgs);

  // Step 4: Assemble InstallManifest
  return {
    projectInfo,
    venvResult,
    healthReport,
    fileCount: dirEntries.length,
    totalSizeBytes: venvResult.sizeBytes,
    timestamp: new Date().toISOString(),
  };
}
