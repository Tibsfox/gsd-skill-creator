/**
 * WHDLoad integration module: slave detection, Kickstart naming, and config builder.
 *
 * WHDLoad is the standard way to run Amiga games and demos from hard drive
 * instead of floppy. It requires specific Kickstart ROM files in
 * `Devs:Kickstarts/` with particular naming conventions, and each game may
 * have different hardware requirements (CPU speed, chipset, RAM).
 *
 * This module:
 * 1. Detects WHDLoad .Slave files in installed package directories
 * 2. Maps Kickstart revision numbers to WHDLoad-convention filenames
 * 3. Builds FS-UAE configs with per-game hardware overrides from the
 *    WHDLoad database (WhdloadEntry)
 *
 * @module whdload
 */

import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import type { WhdloadEntry, FsUaeConfig, LaunchConfig } from './types.js';
import { getProfile } from './hardware-profiles.js';
import { buildFsUaeConfig } from './emulator-config.js';

// ---------------------------------------------------------------------------
// WHDLoad Kickstart filename map
// ---------------------------------------------------------------------------

/**
 * Maps Kickstart revision numbers to WHDLoad-convention filenames.
 *
 * WHDLoad expects Kickstart ROM copies in `Devs:Kickstarts/` using the
 * naming pattern: `kick` + revision-without-dot + `.` + model.
 *
 * Example: revision "34.005" -> "kick34005.A500"
 */
export const WHDLOAD_KICKSTART_MAP: Record<string, string> = {
  '34.005': 'kick34005.A500',
  '37.175': 'kick37175.A500',
  '37.299': 'kick37299.A600',
  '37.300': 'kick37300.A600',
  '39.106': 'kick39106.A1200',
  '40.063': 'kick40063.A600',
  '40.068': 'kick40068.A1200',
  '40.070': 'kick40070.A4000T',
};

// ---------------------------------------------------------------------------
// Slave file detection
// ---------------------------------------------------------------------------

/**
 * Recursively walk a directory and collect all file paths (relative to root).
 */
function walkDirectory(dir: string, rootDir: string): string[] {
  const results: string[] = [];

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath, rootDir));
    } else if (entry.isFile()) {
      results.push(relative(rootDir, fullPath));
    }
  }

  return results;
}

/**
 * Detect WHDLoad .Slave files in an installed package directory.
 *
 * Recursively scans `installDir` for files with a `.Slave` extension
 * (case-insensitive: .slave, .Slave, .SLAVE all match).
 *
 * Returns a sorted array of relative paths. Returns an empty array
 * if the directory doesn't exist or contains no slave files (graceful
 * degradation -- never throws).
 *
 * @param installDir - Absolute path to the installed game directory
 * @returns Sorted array of relative paths to .Slave files
 */
export function detectSlaveFiles(installDir: string): string[] {
  if (!existsSync(installDir)) {
    return [];
  }

  const allFiles = walkDirectory(installDir, installDir);
  const slaves = allFiles.filter(
    (f) => extname(f).toLowerCase() === '.slave',
  );

  return slaves.sort();
}

// ---------------------------------------------------------------------------
// Clock speed mapping
// ---------------------------------------------------------------------------

/**
 * Map WHDLoad clock values to FS-UAE cpu_speed settings.
 *
 * - '7'   -> 'real'  (7.14 MHz, real A500 speed)
 * - '14'  -> '2x'    (14 MHz, doubled)
 * - '25'  -> 'max'   (as fast as possible)
 * - '28'  -> 'max'
 * - 'MAX' -> 'max'
 */
const CLOCK_MAP: Record<string, string> = {
  '7': 'real',
  '14': '2x',
  '25': 'max',
  '28': 'max',
  MAX: 'max',
};

// ---------------------------------------------------------------------------
// CPU to amiga_model mapping
// ---------------------------------------------------------------------------

/**
 * Map WHDLoad CPU requirements to FS-UAE amiga_model values.
 */
const CPU_MODEL_MAP: Record<string, string> = {
  '68000': 'A500',
  '68010': 'A500',
  '68020': 'A1200',
  '68040': 'A4000/040',
};

// ---------------------------------------------------------------------------
// Chipset to amiga_model mapping
// ---------------------------------------------------------------------------

/**
 * Map chipset requirements to FS-UAE amiga_model values.
 */
const CHIPSET_MODEL_MAP: Record<string, string> = {
  OCS: 'A500',
  ECS: 'A500',
  AGA: 'A1200',
};

// ---------------------------------------------------------------------------
// Config builder
// ---------------------------------------------------------------------------

/**
 * Build an FS-UAE configuration for a WHDLoad game launch.
 *
 * Starts from the WHDLoad base profile (A1200 + 8MB fast RAM) and applies
 * per-game hardware overrides from the WhdloadEntry database. Overrides
 * include CPU type, chipset, RAM sizes, NTSC mode, and clock speed.
 *
 * Key behaviors:
 * - save_states forced to 0 (directory hard drives cause corruption, per FS-UAE research Pitfall 3)
 * - PRELOAD hint set when fast RAM >= 4 MB (allows WHDLoad to preload game into fast RAM)
 * - hard_drive_0 points to the installed game directory
 *
 * @param entry      - WHDLoad database entry with hardware requirements
 * @param config     - Launch configuration with ROM path and drives
 * @param installDir - Absolute path to the installed game directory
 * @returns Flat FS-UAE config key-value object
 */
export function buildWhdloadConfig(
  entry: WhdloadEntry,
  config: LaunchConfig,
  installDir: string,
): FsUaeConfig {
  // Start from the WHDLoad base profile
  const baseProfile = getProfile('whdload')!;

  // Build a mutable profile copy for hardware overrides
  const profile = structuredClone(baseProfile) as {
    amigaModel: string;
    chipMemoryKb: number;
    slowMemoryKb: number;
    fastMemoryKb: number;
    cpu: string;
    chipset: string;
    display: { width: number; height: number };
    sound: { stereoSeparation: number };
    id: string;
    name: string;
    kickstartVersion: string;
    kickstartRevision: string;
  };

  // Apply hardware overrides from WhdloadEntry
  const hw = entry.hardware;

  if (hw.cpu) {
    profile.cpu = hw.cpu;
    // Adjust amiga_model to match CPU capability
    const mappedModel = CPU_MODEL_MAP[hw.cpu];
    if (mappedModel) {
      profile.amigaModel = mappedModel;
    }
  }

  if (hw.chipset) {
    const mappedModel = CHIPSET_MODEL_MAP[hw.chipset];
    if (mappedModel) {
      profile.amigaModel = mappedModel;
    }
  }

  if (hw.fastRamMb !== undefined) {
    profile.fastMemoryKb = hw.fastRamMb * 1024;
  }

  if (hw.z3RamMb !== undefined) {
    // z3RamMb is handled separately as zorro_iii_memory after config build
  }

  // Build the base config using the overridden profile
  // Force save states off and pass through the launch config
  const launchOverride: LaunchConfig = {
    ...config,
    saveStates: false,
    hardDrives: [
      { path: installDir, label: 'DH0' },
      ...config.hardDrives,
    ],
  };

  const result = buildFsUaeConfig(profile as any, launchOverride);

  // Force save_states = 0 (WHDLoad with directory hard drives -- corruption prevention)
  result.save_states = 0;

  // Apply WHDLoad-specific settings
  if (hw.ntsc) {
    result.ntsc_mode = 1;
  }

  if (hw.clock) {
    const speed = CLOCK_MAP[hw.clock];
    if (speed) {
      result.cpu_speed = speed;
    }
  }

  // Zorro III memory (separate from fast memory)
  if (hw.z3RamMb !== undefined) {
    result.zorro_iii_memory = hw.z3RamMb * 1024;
  }

  // PRELOAD hint: when enough fast RAM is available for WHDLoad preloading
  const effectiveFastKb = hw.fastRamMb !== undefined
    ? hw.fastRamMb * 1024
    : baseProfile.fastMemoryKb;
  if (effectiveFastKb >= 4096) {
    result.whdload_preload = 1;
  }

  return result;
}
