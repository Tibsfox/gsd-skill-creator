/**
 * Extraction tool validator.
 *
 * Checks whether lha (from lhasa package) and unlzx are available
 * on the system at initialization time. Provides platform-specific
 * install guidance when tools are missing.
 *
 * lha is required (covers ~95% of Aminet archives).
 * unlzx is optional with graceful degradation (covers ~5% LZX archives).
 *
 * @module
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';
import type { ToolStatus } from './types.js';

const execFileAsync = promisify(execFile);

/** Timeout for tool availability checks (5 seconds) */
const CHECK_TIMEOUT_MS = 5_000;

/**
 * Get platform-specific install guidance for lha (lhasa).
 */
function getLhaInstallGuide(os: string): string {
  if (os === 'darwin') {
    return 'brew install lhasa';
  }
  return 'sudo apt install lhasa';
}

/**
 * Get install guidance for unlzx (always includes GitHub URL).
 */
function getUnlzxInstallGuide(): string {
  return (
    'Build from source: https://github.com/nhoudelot/unlzx\n' +
    'Or: sudo apt install unlzx (if available)'
  );
}

/**
 * Check availability of lha tool.
 */
async function checkLha(os: string): Promise<ToolStatus> {
  try {
    const { stdout } = await execFileAsync('lha', ['--version'], {
      timeout: CHECK_TIMEOUT_MS,
    });
    const version = stdout.trim().split('\n')[0] ?? null;
    return {
      name: 'lha',
      available: true,
      version,
      installGuide: '',
      required: true,
    };
  } catch {
    return {
      name: 'lha',
      available: false,
      version: null,
      installGuide: getLhaInstallGuide(os),
      required: true,
    };
  }
}

/**
 * Check availability of unlzx tool.
 *
 * unlzx with no args prints usage to stderr and exits with code 2.
 * This means the tool IS available -- it just needs arguments.
 * An ENOENT error means the tool is not installed.
 */
async function checkUnlzx(): Promise<ToolStatus> {
  try {
    await execFileAsync('unlzx', [], { timeout: CHECK_TIMEOUT_MS });
    // If it succeeds (exit 0), it's available
    return {
      name: 'unlzx',
      available: true,
      version: null,
      installGuide: '',
      required: false,
    };
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown>;
    const msg = err instanceof Error ? err.message : String(err);
    const stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';

    // unlzx exits with code 2 when called with no args (prints usage)
    // This means the tool IS available
    if (
      errObj.code === 2 ||
      msg.includes('exit code 2') ||
      stderr.includes('Usage')
    ) {
      return {
        name: 'unlzx',
        available: true,
        version: null,
        installGuide: '',
        required: false,
      };
    }

    // ENOENT or other error means not available
    return {
      name: 'unlzx',
      available: false,
      version: null,
      installGuide: getUnlzxInstallGuide(),
      required: false,
    };
  }
}

/**
 * Validate that required extraction tools are available on the system.
 *
 * Checks for lha (from lhasa package) and unlzx. Returns an array
 * of ToolStatus entries with availability, version info, and
 * platform-specific install guidance for missing tools.
 *
 * @returns Array of 2 ToolStatus entries (lha, unlzx)
 */
export async function validateExtractionTools(): Promise<ToolStatus[]> {
  const os = platform();
  const [lha, unlzx] = await Promise.all([checkLha(os), checkUnlzx()]);
  return [lha, unlzx];
}
