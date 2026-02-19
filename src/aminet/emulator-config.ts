/**
 * FS-UAE configuration generator.
 *
 * Transforms structured HardwareProfile + LaunchConfig objects into the flat
 * `key = value` format that FS-UAE expects in its .fs-uae config files.
 *
 * All paths are normalized to forward slashes (FS-UAE convention) regardless
 * of host OS. Keys use underscores per FS-UAE naming convention.
 *
 * @module
 */

import type { HardwareProfile, FsUaeConfig, LaunchConfig } from './types.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a filesystem path to forward slashes (FS-UAE convention).
 * Handles Windows backslashes and mixed slash styles.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a flat FS-UAE configuration object from a hardware profile and
 * launch configuration.
 *
 * The returned object uses FS-UAE underscore key names (e.g., `amiga_model`,
 * `chip_memory`) and can be passed to `generateFsUaeConfig` for serialization.
 *
 * @param profile - Hardware profile defining the emulated Amiga
 * @param config  - Launch configuration with ROM, drives, and options
 * @returns Flat FS-UAE config key-value object
 */
export function buildFsUaeConfig(profile: HardwareProfile, config: LaunchConfig): FsUaeConfig {
  const result: FsUaeConfig = {
    // Core hardware from profile
    amiga_model: profile.amigaModel,
    kickstart_file: normalizePath(config.kickstartFile),
    chip_memory: profile.chipMemoryKb,
    slow_memory: profile.slowMemoryKb,
    fast_memory: profile.fastMemoryKb,

    // Display settings
    window_width: profile.display.width,
    window_height: profile.display.height,
    keep_aspect: 1,
    fullscreen: 0,

    // Audio settings
    volume: 100,
    stereo_separation: profile.sound.stereoSeparation,

    // Emulation accuracy
    accuracy: 1,

    // Save states
    save_states: config.saveStates ? 1 : 0,
  };

  // Save states directory
  if (config.saveStatesDir) {
    result.save_states_dir = normalizePath(config.saveStatesDir);
  }

  // Hard drives (0-9)
  for (let i = 0; i < config.hardDrives.length; i++) {
    const drive = config.hardDrives[i];
    result[`hard_drive_${i}`] = normalizePath(drive.path);
    result[`hard_drive_${i}_label`] = drive.label;
    if (drive.readOnly) {
      result[`hard_drive_${i}_read_only`] = '1';
    }
    if (drive.bootPriority !== undefined) {
      result[`hard_drive_${i}_priority`] = drive.bootPriority;
    }
  }

  // Floppy drives (0-3)
  if (config.floppyDrives) {
    for (let i = 0; i < config.floppyDrives.length; i++) {
      result[`floppy_drive_${i}`] = normalizePath(config.floppyDrives[i]);
    }
  }

  // Extra options (advanced overrides -- merged last so they win)
  if (config.extraOptions) {
    for (const [key, value] of Object.entries(config.extraOptions)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serialize a flat FS-UAE configuration object to the `.fs-uae` file format.
 *
 * Output format:
 * ```
 * [config]
 * key = value
 * key = value
 * ```
 *
 * Keys are sorted alphabetically for deterministic output.
 * Boolean values are serialized as "1"/"0".
 * String values have backslashes normalized to forward slashes.
 * Undefined values are omitted.
 *
 * @param config - Flat FS-UAE config key-value object
 * @returns Serialized config string ready to write to a .fs-uae file
 */
export function generateFsUaeConfig(config: FsUaeConfig): string {
  let output = '[config]\n';

  const entries = Object.entries(config).sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of entries) {
    if (value === undefined) {
      continue;
    }

    let serialized: string;
    if (typeof value === 'boolean') {
      serialized = value ? '1' : '0';
    } else if (typeof value === 'number') {
      serialized = String(value);
    } else {
      serialized = normalizePath(value);
    }

    output += `${key} = ${serialized}\n`;
  }

  return output;
}
