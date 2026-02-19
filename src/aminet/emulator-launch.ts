/**
 * Profile auto-selection and emulator launch orchestrator.
 *
 * Maps .readme Requires/Architecture fields to hardware profiles using
 * priority-based selection, writes FS-UAE config files to disk, and
 * spawns the FS-UAE process with structured error handling.
 *
 * Uses graceful degradation: launch errors return structured LaunchResult
 * objects (never throws). Missing FS-UAE produces actionable install guidance.
 *
 * @module emulator-launch
 */

import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { HardwareProfileId, LaunchConfig, LaunchResult } from './types.js';
import { getProfile } from './hardware-profiles.js';
import { buildFsUaeConfig, generateFsUaeConfig } from './emulator-config.js';

// ---------------------------------------------------------------------------
// Profile auto-selection
// ---------------------------------------------------------------------------

/**
 * Select the best hardware profile based on .readme Requires and Architecture fields.
 *
 * Uses priority-based matching (first match wins):
 * 1. WHDLoad -> 'whdload'
 * 2. 68040/040 -> 'a4000'
 * 3. 68030/030 -> 'a1200-030'
 * 4. AGA -> 'a1200'
 * 5. 68020/020 -> 'a1200'
 * 6. OS 3.x / OS 2.x -> 'a1200'
 * 7. Default -> 'a500' (maximum compatibility)
 *
 * All matching is case-insensitive via lowercased input.
 *
 * @param requires - Parsed Requires: field entries from .readme
 * @param architecture - Parsed Architecture: field entries from .readme
 * @returns The best-matching hardware profile ID
 */
export function selectProfileFromReadme(
  requires: string[],
  _architecture: string[],
): HardwareProfileId {
  const lower = requires.map((r) => r.toLowerCase());

  // Priority 1: WHDLoad
  if (lower.some((r) => r.includes('whdload'))) {
    return 'whdload';
  }

  // Priority 2: 68040+
  if (lower.some((r) => r.includes('68040') || r === '040' || r.startsWith('040'))) {
    return 'a4000';
  }

  // Priority 3: 68030+
  if (lower.some((r) => r.includes('68030') || r === '030' || r.startsWith('030'))) {
    return 'a1200-030';
  }

  // Priority 4: AGA chipset
  if (lower.some((r) => r.includes('aga'))) {
    return 'a1200';
  }

  // Priority 5: 68020+
  if (lower.some((r) => r.includes('68020') || r === '020' || r.startsWith('020'))) {
    return 'a1200';
  }

  // Priority 6: OS 3.x or OS 2.x (needs at least A1200 for safety)
  if (lower.some((r) => r.includes('os 3') || r.includes('3.0') || r.includes('3.1') || r.includes('amigaos 2') || r.includes('os 2'))) {
    return 'a1200';
  }

  // Default: A500 (maximum compatibility)
  return 'a500';
}

// ---------------------------------------------------------------------------
// Config file writing
// ---------------------------------------------------------------------------

/**
 * Write an FS-UAE config string to disk.
 *
 * Creates parent directories recursively if they don't exist.
 * Overwrites any existing file at the same path.
 *
 * @param configString - Serialized FS-UAE config content
 * @param outputPath - Absolute path where the .fs-uae file should be written
 */
export function writeFsUaeConfig(configString: string, outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, configString, 'utf-8');
}

// ---------------------------------------------------------------------------
// Emulator launch
// ---------------------------------------------------------------------------

/**
 * Launch FS-UAE with the given configuration.
 *
 * Orchestrates config generation, file writing, and process spawning.
 * Returns a structured LaunchResult -- never throws.
 *
 * Error codes:
 * - NO_HARD_DRIVES: no hard drives configured
 * - INVALID_PROFILE: hardware profile not found
 * - FSUAE_MISSING: FS-UAE binary not found (ENOENT)
 * - LAUNCH_FAILED: FS-UAE exited with an error
 *
 * @param config - Launch configuration with profile, ROM, and drives
 * @param configDir - Directory where the .fs-uae config file will be written
 * @returns Structured launch result (success or error with guidance)
 */
export async function launchEmulator(
  config: LaunchConfig,
  configDir: string,
): Promise<LaunchResult> {
  // Validate hard drives
  if (config.hardDrives.length === 0) {
    return {
      success: false,
      error: {
        code: 'NO_HARD_DRIVES',
        message: 'No hard drives configured',
        guidance: 'At least one hard drive mount is required for FS-UAE to boot.',
      },
    };
  }

  // Resolve hardware profile
  const profile = getProfile(config.profileId);
  if (!profile) {
    return {
      success: false,
      error: {
        code: 'INVALID_PROFILE',
        message: `Hardware profile not found: ${config.profileId}`,
        guidance: 'Use one of: a500, a1200, a1200-030, a4000, whdload.',
      },
    };
  }

  // Build and serialize config
  const fsUaeConfig = buildFsUaeConfig(profile, config);
  const configString = generateFsUaeConfig(fsUaeConfig);

  // Write config file with timestamp-based unique name
  const configPath = join(configDir, `launch-${Date.now()}.fs-uae`);
  writeFsUaeConfig(configString, configPath);

  // Determine FS-UAE binary
  const fsUaeBin = config.fsUaePath ?? 'fs-uae';

  // Spawn FS-UAE
  try {
    await new Promise<void>((resolve, reject) => {
      execFile(fsUaeBin, [configPath], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return {
      success: true,
      configPath,
    };
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;

    if (error.code === 'ENOENT') {
      return {
        success: false,
        configPath,
        error: {
          code: 'FSUAE_MISSING',
          message: 'FS-UAE not found',
          guidance:
            'Install FS-UAE: sudo apt install fs-uae (Linux) or brew install fs-uae (macOS) or https://fs-uae.net/download',
        },
      };
    }

    return {
      success: false,
      configPath,
      error: {
        code: 'LAUNCH_FAILED',
        message: error.message,
        guidance: 'Check FS-UAE logs for details',
      },
    };
  }
}
