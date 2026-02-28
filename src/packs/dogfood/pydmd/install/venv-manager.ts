/**
 * Virtual environment lifecycle manager: creates isolated venvs,
 * installs dependencies, enforces disk budgets, and cleans up on failure.
 *
 * Part of the PyDMD dogfood install pipeline (Phase 404).
 */

import type { VenvConfig, VenvResult, PythonProjectInfo } from '../types.js';

// --- Types ---

export type CommandExecutor = (
  cmd: string,
  args: string[],
  opts?: { cwd?: string; timeout?: number },
) => Promise<{ stdout: string; stderr: string; exitCode: number }>;

// --- Constants ---

const DISK_WARN_BYTES = 500 * 1024 * 1024;   // 500 MB
const DISK_HARD_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const PIP_INSTALL_TIMEOUT = 5 * 60 * 1000;    // 5 minutes
const PIP_UPGRADE_TIMEOUT = 2 * 60 * 1000;    // 2 minutes

// --- Default executor (real subprocess -- tests always inject mock) ---

const defaultExec: CommandExecutor = async (cmd, args, opts) => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  try {
    const result = await execFileAsync(cmd, args, {
      cwd: opts?.cwd,
      timeout: opts?.timeout,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? String(err),
      exitCode: e.code ?? 1,
    };
  }
};

// --- Helpers ---

function pythonBin(venvPath: string): string {
  // Linux/macOS
  return `${venvPath}/bin/python`;
}

function makeFailResult(venvPath: string, errors: string[]): VenvResult {
  return {
    success: false,
    venvPath,
    pythonPath: '',
    installedPackages: [],
    installErrors: errors,
    sizeBytes: 0,
  };
}

function buildInstallArgs(config: VenvConfig): string[] {
  // Build the pip install command args
  const args = ['-m', 'pip', 'install', '-e'];

  // Determine extras specifier from installGroups
  const extraGroups = config.installGroups.filter(g => g !== 'core');
  if (extraGroups.length > 0) {
    args.push(`.[${extraGroups.join(',')}]`);
  } else {
    args.push('.');
  }

  return args;
}

// --- Public API ---

/**
 * Create a virtual environment and install dependencies.
 */
export async function createVenv(
  config: VenvConfig,
  projectInfo: PythonProjectInfo,
  exec: CommandExecutor = defaultExec,
): Promise<VenvResult> {
  const errors: string[] = [];

  // Step 1: Create venv
  const pythonCmd = `python${config.pythonVersion}`;
  try {
    const venvResult = await exec(pythonCmd, ['-m', 'venv', config.venvPath]);
    if (venvResult.exitCode !== 0) {
      return makeFailResult(config.venvPath, [
        `Failed to create venv: ${venvResult.stderr || 'python venv creation failed'}`,
      ]);
    }
  } catch (err) {
    return makeFailResult(config.venvPath, [
      `Failed to create venv: ${err instanceof Error ? err.message : String(err)}`,
    ]);
  }

  const pyPath = pythonBin(config.venvPath);

  // Step 2: Upgrade pip
  try {
    await exec(pyPath, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
      cwd: config.projectPath,
      timeout: PIP_UPGRADE_TIMEOUT,
    });
  } catch {
    // Non-fatal: pip upgrade failure is a warning, not a blocker
    errors.push('Warning: pip upgrade failed');
  }

  // Step 3: Install dependencies
  const installArgs = buildInstallArgs(config);
  try {
    const installResult = await exec(pyPath, installArgs, {
      cwd: config.projectPath,
      timeout: PIP_INSTALL_TIMEOUT,
    });
    if (installResult.exitCode !== 0) {
      // Install failed -- cleanup and return
      await cleanupVenv(config.venvPath, exec);
      return makeFailResult(config.venvPath, [
        `pip install failed: ${installResult.stderr || 'unknown error'}`,
      ]);
    }
  } catch (err) {
    // Likely timeout
    await cleanupVenv(config.venvPath, exec);
    return makeFailResult(config.venvPath, [
      `pip install timed out: ${err instanceof Error ? err.message : String(err)}`,
    ]);
  }

  // Step 4: Get installed packages via pip freeze
  let installedPackages: string[] = [];
  try {
    const freezeResult = await exec(pyPath, ['-m', 'pip', 'freeze']);
    if (freezeResult.exitCode === 0) {
      installedPackages = freezeResult.stdout
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
    }
  } catch {
    // Non-fatal
  }

  // Step 5: Check disk usage
  let sizeBytes = 0;
  try {
    const duResult = await exec('du', ['-sb', config.venvPath]);
    if (duResult.exitCode === 0) {
      const sizeStr = duResult.stdout.split('\t')[0];
      sizeBytes = parseInt(sizeStr, 10) || 0;
    }
  } catch {
    // Non-fatal
  }

  // Disk budget enforcement
  if (sizeBytes > DISK_HARD_LIMIT_BYTES) {
    await cleanupVenv(config.venvPath, exec);
    return makeFailResult(config.venvPath, [
      `Disk budget exceeded: venv is ${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)}GB (2GB limit)`,
    ]);
  }

  if (sizeBytes > DISK_WARN_BYTES) {
    errors.push(
      `Warning: venv size is ${(sizeBytes / (1024 * 1024)).toFixed(0)}MB (500MB warning threshold)`,
    );
  }

  return {
    success: true,
    venvPath: config.venvPath,
    pythonPath: pyPath,
    installedPackages,
    installErrors: errors,
    sizeBytes,
  };
}

/**
 * Remove a virtual environment directory.
 */
export async function cleanupVenv(
  venvPath: string,
  exec: CommandExecutor = defaultExec,
): Promise<void> {
  try {
    await exec('rm', ['-rf', venvPath]);
  } catch {
    // Swallow errors -- best-effort cleanup
  }
}
